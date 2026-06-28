from backend.config.database import db
from backend.models.Issue import Issue
from backend.models.Fine import Fine
from datetime import datetime

class FineService:
    @staticmethod
    def check_and_update_overdue_fines(fine_rate_per_day: float):
        """
        Scans all active issues, updates overdue flags, and calculates fine amounts.
        Returns the number of updated records.
        """
        now = datetime.utcnow()
        active_issues = Issue.query.filter_by(status='issued').all()
        updated_count = 0
        
        for issue in active_issues:
            if issue.due_date < now:
                issue.status = 'overdue'
                days_overdue = (now - issue.due_date).days
                fine_amount = days_overdue * fine_rate_per_day
                issue.fine_amount = fine_amount
                
                # Check if a Fine record already exists, if not, create it
                existing_fine = Fine.query.filter_by(issue_id=issue.id).first()
                if not existing_fine and fine_amount > 0:
                    fine = Fine(
                        issue_id=issue.id,
                        member_id=issue.member_id,
                        amount=fine_amount,
                        status='pending'
                    )
                    db.session.add(fine)
                elif existing_fine and existing_fine.status == 'pending':
                    # Update fine amount
                    existing_fine.amount = fine_amount
                    
                updated_count += 1
                
        db.session.commit()
        return updated_count

    @staticmethod
    def settle_fine(fine_id: int, approver_id: int = None, transaction_reference: str = None, payment_date: datetime = None):
        """
        Marks a pending fine invoice as paid and clears the fine amount on the issue.
        """
        fine = Fine.query.get(fine_id)
        if not fine:
            raise Exception("Fine record not found")
            
        if fine.status == 'paid':
            return fine
            
        fine.status = 'paid'
        fine.approver_id = approver_id
        fine.transaction_reference = transaction_reference
        fine.payment_date = payment_date or datetime.utcnow()
        
        # Settle fine on the issue too if attached
        if fine.issue:
            fine.issue.fine_amount = 0.0
            
        db.session.commit()
        return fine
