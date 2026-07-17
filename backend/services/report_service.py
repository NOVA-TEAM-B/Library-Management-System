from backend.models.Book import Book
from backend.models.User import User
from backend.models.Issue import Issue
from backend.models.Fine import Fine
from backend.models.Reservation import Reservation
from datetime import datetime

class ReportService:
    @staticmethod
    def compile_report(report_type: str, org_id: int = None):
        """
        Compiles structural JSON report logs for admin downloads and Power BI grids.
        """
        report_data = []
        cols = []
        
        if report_type == 'books':
            query = Book.query
            if org_id is not None:
                query = query.filter_by(org_id=org_id)
            books = query.all()
            for b in books:
                report_data.append({
                    "col1": b.isbn,
                    "col2": b.title,
                    "col3": b.author,
                    "col4": b.category,
                    "col5": "Available" if b.availability else "Out of Stock",
                    "col6": str(b.quantity)
                })
            cols = ["ISBN", "Title", "Author", "Category", "Status", "Quantity"]
            
        elif report_type == 'members':
            query = User.query.filter_by(role='member')
            if org_id is not None:
                query = query.filter_by(org_id=org_id)
            members = query.all()
            for m in members:
                report_data.append({
                    "col1": m.membership_id or 'N/A',
                    "col2": m.username,
                    "col3": m.email,
                    "col4": m.department or 'General',
                    "col5": m.status,
                    "col6": m.created_at.strftime('%Y-%m-%d') if m.created_at else '-'
                })
            cols = ["ID", "Username", "Email", "Department", "Status", "Joined"]
            
        elif report_type == 'issues':
            query = Issue.query
            if org_id is not None:
                query = query.filter_by(org_id=org_id)
            issues = query.all()
            for i in issues:
                report_data.append({
                    "col1": i.book.title if i.book else 'Unknown',
                    "col2": i.member.username if i.member else 'Unknown',
                    "col3": i.issue_date.strftime('%Y-%m-%d') if i.issue_date else '-',
                    "col4": i.due_date.strftime('%Y-%m-%d') if i.due_date else '-',
                    "col5": i.return_date.strftime('%Y-%m-%d') if i.return_date else 'Not Returned',
                    "col6": i.status
                })
            cols = ["Book Title", "Member", "Issue Date", "Due Date", "Returned", "Status"]
            
        elif report_type == 'fines':
            query = Fine.query
            if org_id is not None:
                query = query.filter_by(org_id=org_id)
            fines = query.all()
            for f in fines:
                report_data.append({
                    "col1": f"TX-{1000 + f.id}",
                    "col2": f.member.username if f.member else 'Unknown',
                    "col3": f.issue.book.title if (f.issue and f.issue.book) else 'N/A',
                    "col4": f"${f.amount:.2f}",
                    "col5": f.status,
                    "col6": f.created_at.strftime('%Y-%m-%d') if f.created_at else '-'
                })
            cols = ["Tx ID", "Member", "Book Title", "Amount", "Status", "Logged Date"]
            
        elif report_type == 'reservations':
            query = Reservation.query
            if org_id is not None:
                query = query.filter_by(org_id=org_id)
            res = query.all()
            for r in res:
                report_data.append({
                    "col1": r.book.title if r.book else 'Unknown',
                    "col2": r.member.username if r.member else 'Unknown',
                    "col3": r.reservation_date.strftime('%Y-%m-%d') if r.reservation_date else '-',
                    "col4": r.status,
                    "col5": r.member.email if r.member else '-',
                    "col6": str(r.id)
                })
            cols = ["Book Title", "Member", "Hold Date", "Status", "Email", "Res ID"]
            
        else:
            raise Exception("Invalid report type specified")
            
        return {
            "columns": cols,
            "data": report_data
        }
