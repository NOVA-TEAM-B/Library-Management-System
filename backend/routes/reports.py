from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt
from backend.services.report_service import ReportService
from backend.middleware.auth_middleware import role_required
from datetime import datetime
import csv
import io

reports_bp = Blueprint('reports', __name__)

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
