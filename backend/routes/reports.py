from flask import Blueprint, request, jsonify, send_file, render_template_string
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request
from backend.services.report_service import ReportService
from backend.middleware.auth_middleware import role_required
from backend.models.Book import Book
from backend.models.Issue import Issue
from backend.config.database import db
from datetime import datetime
import csv
import io
import os

reports_bp = Blueprint('reports', __name__)

def check_export_authorization():
    # 1. Try checking standard JWT header in request
    try:
        verify_jwt_in_request(optional=True)
        claims = get_jwt()
        if claims and claims.get("role") in ('admin', 'librarian'):
            return True, claims.get("org_id")
    except Exception:
        pass

    # 2. Try checking query parameter 'token'
    token = request.args.get('token')
    if token:
        try:
            from flask_jwt_extended import decode_token
            decoded = decode_token(token)
            # Custom claims are stored at root level of decoded dict
            role = decoded.get('role')
            org_id = decoded.get('org_id')
            if role in ('admin', 'librarian'):
                return True, org_id
        except Exception as e:
            print(f"Token parsing error: {e}", flush=True)
            pass

    return False, None

def fetch_books_report_data():
    books = Book.query.all()
    rows = []
    
    # Pre-fetch active issues count grouped by book_id to optimize query speed
    active_issues = db.session.query(
        Issue.book_id, db.func.count(Issue.id)
    ).filter(Issue.status == 'issued').group_by(Issue.book_id).all()
    
    active_issues_map = {b_id: count for b_id, count in active_issues}
    
    for b in books:
        active_count = active_issues_map.get(b.id, 0)
        available = max(0, b.quantity - active_count)
        status = "Available" if available > 0 else "Out of Stock"
        
        # Created Date fallback using current date
        created_date = datetime.utcnow().strftime('%Y-%m-%d')
        
        rows.append({
            "book_id": b.id,
            "isbn": b.isbn,
            "title": b.title,
            "author": b.author,
            "category": b.category,
            "status": status,
            "copies": b.quantity,
            "available": available,
            "created_date": created_date
        })
    return rows

@reports_bp.route('/generate', methods=['GET'])
@jwt_required()
@role_required('admin', 'librarian')
def generate_report():
    report_type = request.args.get('type', 'books')
    try:
        report = ReportService.compile_report(report_type)
        return jsonify(report), 200
    except Exception as e:
        return jsonify({"msg": str(e)}), 400

@reports_bp.route('/export', methods=['GET'])
@jwt_required()
@role_required('admin', 'librarian')
def export_report():
    report_type = request.args.get('type', 'books')
    format_type = request.args.get('format', 'csv')
    
    if report_type == 'books':
        if format_type == 'csv':
            return export_books_csv()
        elif format_type == 'xlsx':
            return export_books_excel()
        elif format_type == 'pdf':
            return export_books_pdf()
        else:
            return jsonify({"msg": "Unsupported export format"}), 400
            
    # Fallback to existing CSV logic for other report types
    try:
        report = ReportService.compile_report(report_type)
        cols = report['columns']
        rows = report['data']
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(cols)
        
        for r in rows:
            writer.writerow([r['col1'], r['col2'], r['col3'], r['col4'], r['col5'], r['col6']])
            
        mem_file = io.BytesIO()
        mem_file.write(output.getvalue().encode('utf-8'))
        mem_file.seek(0)
        
        return send_file(
            mem_file,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f"nova_x_{report_type}_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        )
        
    except Exception as e:
        return jsonify({"msg": str(e)}), 400

@reports_bp.route('/books/csv', methods=['GET'])
def export_books_csv_endpoint():
    auth, org_id = check_export_authorization()
    if not auth:
        return jsonify({"msg": "Access denied. Unauthorized."}), 403
    return export_books_csv()

@reports_bp.route('/books/excel', methods=['GET'])
def export_books_excel_endpoint():
    auth, org_id = check_export_authorization()
    if not auth:
        return jsonify({"msg": "Access denied. Unauthorized."}), 403
    return export_books_excel()

@reports_bp.route('/books/pdf', methods=['GET'])
def export_books_pdf_endpoint():
    auth, org_id = check_export_authorization()
    if not auth:
        return jsonify({"msg": "Access denied. Unauthorized."}), 403
    return export_books_pdf()

@reports_bp.route('/books/print', methods=['GET'])
def export_books_print_endpoint():
    auth, org_id = check_export_authorization()
    if not auth:
        return jsonify({"msg": "Access denied. Unauthorized."}), 403
    return export_books_print()


def export_books_csv():
    try:
        data = fetch_books_report_data()
        output = io.StringIO()
        writer = csv.writer(output)
        
        # CSV Headers
        headers = ["Book ID", "ISBN", "Title", "Author", "Category", "Status", "Copies", "Available", "Created Date"]
        writer.writerow(headers)
        
        for r in data:
            writer.writerow([
                r["book_id"], r["isbn"], r["title"], r["author"], r["category"],
                r["status"], r["copies"], r["available"], r["created_date"]
            ])
            
        mem_file = io.BytesIO()
        mem_file.write(output.getvalue().encode('utf-8'))
        mem_file.seek(0)
        
        filename = f"books_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        return send_file(
            mem_file,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"msg": f"CSV generation failed: {str(e)}"}), 500


def export_books_excel():
    try:
        import pandas as pd
        data = fetch_books_report_data()
        
        df = pd.DataFrame(data)
        df.columns = ["Book ID", "ISBN", "Title", "Author", "Category", "Status", "Copies", "Available", "Created Date"]
        
        # Write to byte stream using openpyxl
        out_stream = io.BytesIO()
        with pd.ExcelWriter(out_stream, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Books Inventory', index=False)
            
            # Format workbook (bold headers, auto width)
            workbook = writer.book
            worksheet = writer.sheets['Books Inventory']
            
            # Bold headers
            from openpyxl.styles import Font
            bold_font = Font(bold=True)
            for col_idx in range(1, len(df.columns) + 1):
                cell = worksheet.cell(row=1, column=col_idx)
                cell.font = bold_font
                
            # Auto-fit columns
            for col in worksheet.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = col[0].column_letter
                worksheet.column_dimensions[col_letter].width = max(max_len + 3, 10)
                
        out_stream.seek(0)
        return send_file(
            out_stream,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name="books_report.xlsx"
        )
    except Exception as e:
        return jsonify({"msg": f"Excel generation failed: {str(e)}"}), 500


def export_books_pdf():
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.pdfgen import canvas
        
        data = fetch_books_report_data()
        
        class NumberedCanvas(canvas.Canvas):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self._saved_page_states = []

            def showPage(self):
                self._saved_page_states.append(dict(self.__dict__))
                self._startPage()

            def save(self):
                num_pages = len(self._saved_page_states)
                for state in self._saved_page_states:
                    self.__dict__.update(state)
                    self.draw_page_number(num_pages)
                    super().showPage()
                super().save()

            def draw_page_number(self, page_count):
                self.saveState()
                self.setFont("Helvetica", 8)
                self.setFillColor(colors.HexColor("#475569"))
                
                # Header
                self.drawString(54, 750, "NOVA Library Management System - Books Inventory Report")
                self.setStrokeColor(colors.HexColor("#e2e8f0"))
                self.setLineWidth(0.5)
                self.line(54, 742, 558, 742)
                
                # Footer
                self.line(54, 50, 558, 50)
                self.drawString(54, 38, "Confidential - Nova Library Management System")
                page_str = f"Page {self._pageNumber} of {page_count}"
                self.drawRightString(558, 38, page_str)
                self.restoreState()

        # Build document
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=72,
            bottomMargin=72
        )
        
        styles = getSampleStyleSheet()
        
        # Custom styling
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#1e3a8a')
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#64748b')
        )
        cell_style = ParagraphStyle(
            'CellStyle',
            parent=styles['Normal'],
            fontSize=7,
            leading=9
        )
        header_cell_style = ParagraphStyle(
            'HeaderCellStyle',
            parent=styles['Normal'],
            fontSize=7,
            leading=9,
            textColor=colors.white,
            fontName='Helvetica-Bold'
        )

        elements = []
        
        # Header section with Logo and Title
        logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'logo.png')
        logo_img = Image(logo_path, width=32, height=32) if os.path.exists(logo_path) else Paragraph("", styles['Normal'])
        
        title_p = Paragraph("<b>NOVA INSTITUTE OF TECHNOLOGY</b>", title_style)
        subtitle_p = Paragraph(f"Nova Smart Library - Books Inventory Report (Compiled: {datetime.utcnow().strftime('%Y-%m-%d')})", subtitle_style)
        
        top_table = Table([[logo_img, [title_p, subtitle_p]]], colWidths=[40, 464])
        top_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        
        elements.append(top_table)
        elements.append(Spacer(1, 15))
        
        # Table headers and contents
        headers = ["Book ID", "ISBN", "Title", "Author", "Category", "Status", "Copies", "Available", "Created Date"]
        table_data = [[Paragraph(f"<b>{h}</b>", header_cell_style) for h in headers]]
        
        for r in data:
            table_data.append([
                Paragraph(str(r["book_id"]), cell_style),
                Paragraph(r["isbn"], cell_style),
                Paragraph(r["title"], cell_style),
                Paragraph(r["author"], cell_style),
                Paragraph(r["category"], cell_style),
                Paragraph(f"<font color='{'#10b981' if r['status'] == 'Available' else '#ef4444'}'><b>{r['status']}</b></font>", cell_style),
                Paragraph(str(r["copies"]), cell_style),
                Paragraph(str(r["available"]), cell_style),
                Paragraph(r["created_date"], cell_style)
            ])
            
        # Column widths summing up to 504 points
        col_widths = [35, 60, 110, 80, 75, 45, 30, 35, 44]
        
        books_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        books_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e3a8a')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 3),
            ('RIGHTPADDING', (0,0), (-1,-1), 3),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')])
        ]))
        
        elements.append(books_table)
        
        doc.build(elements, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name="books_report.pdf"
        )
    except Exception as e:
        return jsonify({"msg": f"PDF generation failed: {str(e)}"}), 500


def export_books_print():
    try:
        data = fetch_books_report_data()
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Nova Library - Books Inventory Report</title>
            <link rel="stylesheet" href="/print-report.css">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    color: #0f172a;
                    padding: 40px;
                    margin: 0;
                    background-color: #ffffff;
                }
                .header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 2px solid #cbd5e1;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo-brand {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .logo {
                    width: 50px;
                    height: 50px;
                    object-fit: contain;
                }
                .title {
                    font-size: 20px;
                    font-weight: 800;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .subtitle {
                    font-size: 11px;
                    color: #64748b;
                    margin: 4px 0 0 0;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .date-info {
                    text-align: right;
                }
                .date-label {
                    font-size: 10px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    font-weight: 700;
                    display: block;
                }
                .date-value {
                    font-size: 13px;
                    font-weight: 700;
                    color: #334155;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin-top: 10px;
                }
                th, td {
                    border: 1px solid #e2e8f0;
                    padding: 10px 12px;
                    text-align: left;
                }
                th {
                    background-color: #f1f5f9;
                    font-weight: 700;
                    color: #1e293b;
                    text-transform: uppercase;
                    font-size: 10px;
                    letter-spacing: 0.5px;
                }
                tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .status-avail {
                    color: #10b981;
                    font-weight: 700;
                }
                .status-out {
                    color: #ef4444;
                    font-weight: 700;
                }
                .footer {
                    margin-top: 40px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #64748b;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-brand">
                    <img src="/logo.png" class="logo" alt="Logo">
                    <div>
                        <h1 class="title">NOVA INSTITUTE OF TECHNOLOGY</h1>
                        <p class="subtitle">Nova Smart Library - Books Inventory Report</p>
                    </div>
                </div>
                <div class="date-info">
                    <span class="date-label">Compiled Date</span>
                    <span class="date-value">{{ compiled_date }}</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Book ID</th>
                        <th>ISBN</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Copies</th>
                        <th>Available</th>
                        <th>Created Date</th>
                    </tr>
                </thead>
                <tbody>
                    {% for r in books %}
                    <tr>
                        <td>{{ r.book_id }}</td>
                        <td>{{ r.isbn }}</td>
                        <td><strong>{{ r.title }}</strong></td>
                        <td>{{ r.author }}</td>
                        <td>{{ r.category }}</td>
                        <td>
                            {% if r.status == 'Available' %}
                            <span class="status-avail">Available</span>
                            {% else %}
                            <span class="status-out">Out of Stock</span>
                            {% endif %}
                        </td>
                        <td>{{ r.copies }}</td>
                        <td>{{ r.available }}</td>
                        <td>{{ r.created_date }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>

            <div class="footer">
                <span>Confidential - For Internal Use Only</span>
                <span>Generated by Nova Library Management System</span>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
        """
        compiled_date = datetime.utcnow().strftime('%Y-%m-%d')
        return render_template_string(html_template, books=data, compiled_date=compiled_date)
    except Exception as e:
        return jsonify({"msg": f"Print page generation failed: {str(e)}"}), 500
