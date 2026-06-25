import sys
import os

# Adjust path to import correctly
sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from backend.app import app
from backend.config.database import db
from backend.models.Organization import Organization
from backend.models.User import User
from backend.models.Book import Book
from backend.models.Issue import Issue
from backend.models.Fine import Fine
from backend.models.Reservation import Reservation
from backend.models.AuditLog import AuditLog
from datetime import datetime, timedelta

def seed_database():
    with app.app_context():
        # Clear existing tables
        db.drop_all()
        db.create_all()
        
        print("Database structure initialized. Seeding multi-tenant SaaS records...")
        
        # 1. SEED ORGANIZATIONS
        mit = Organization(
            name="MIT Tech Institute",
            subdomain="mit",
            logo_url="/logo.svg",
            fine_rate=5.0
        )
        vance = Organization(
            name="Vance Business School",
            subdomain="vance",
            logo_url="/logo.svg",
            fine_rate=10.0
        )
        db.session.add(mit)
        db.session.add(vance)
        db.session.commit() # Commit to generate IDs
        
        # 2. CREATE USERS
        # Super Admin (Global SaaS manager)
        super_admin = User(
            username='superadmin',
            email='superadmin@novalibrary.com',
            role='superadmin',
            membership_id='SYS-0001',
            department='SaaS Platform Systems',
            phone='888-999-0000',
            status='active',
            reading_score=100,
            achievement_level='System Overlord',
            late_return_risk='Low'
        )
        super_admin.set_password('admin123')
        db.session.add(super_admin)

        # MIT Admin
        mit_admin = User(
            username='admin',
            email='admin@mit.edu',
            role='admin',
            org_id=mit.id,
            membership_id='ADM-1001',
            department='Administration',
            phone='123-456-7890',
            status='active',
            reading_score=99,
            achievement_level='Knowledge Master',
            late_return_risk='Low'
        )
        mit_admin.set_password('admin123')
        db.session.add(mit_admin)

        # Vance Admin
        vance_admin = User(
            username='vance_admin',
            email='admin@vance.edu',
            role='admin',
            org_id=vance.id,
            membership_id='ADM-2001',
            department='Vance Administration',
            phone='444-555-6666',
            status='active',
            reading_score=98,
            achievement_level='Knowledge Master',
            late_return_risk='Low'
        )
        vance_admin.set_password('admin123')
        db.session.add(vance_admin)

        # MIT Librarian (Staff)
        mit_lib = User(
            username='librarian',
            email='librarian@mit.edu',
            role='librarian',
            org_id=mit.id,
            membership_id='LIB-1001',
            department='Library Science',
            phone='987-654-3210',
            status='active',
            reading_score=98,
            achievement_level='Knowledge Master',
            late_return_risk='Low'
        )
        mit_lib.set_password('lib123')
        db.session.add(mit_lib)

        # MIT Student Member
        student_john = User(
            username='john_doe',
            email='john.doe@mit.edu',
            role='member',
            org_id=mit.id,
            membership_id='MEM-1001',
            department='Computer Science',
            phone='555-0101',
            status='active',
            reading_score=85,
            achievement_level='Platinum Reader',
            late_return_risk='Low'
        )
        student_john.set_password('member123')
        db.session.add(student_john)

        # Vance Student Member
        student_alice = User(
            username='alice_smith',
            email='alice.smith@vance.edu',
            role='member',
            org_id=vance.id,
            membership_id='MEM-2001',
            department='Finance & Banking',
            phone='555-0202',
            status='active',
            reading_score=78,
            achievement_level='Gold Reader',
            late_return_risk='Medium'
        )
        student_alice.set_password('member123')
        db.session.add(student_alice)

        db.session.commit()

        # 3. CREATE BOOKS (Cross-tenant mapping)
        books_data = [
            # MIT Books
            {
                'title': 'The Architecture of Open Source Applications', 'author': 'Amy Brown & Greg Wilson',
                'category': 'Computer Science', 'isbn': '978-1-105-57181-7', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
                'rating': 4.7, 'popularity': 124, 'ai_score': 94, 'org_id': mit.id
            },
            {
                'title': 'Modern Operating Systems', 'author': 'Andrew S. Tanenbaum',
                'category': 'Computer Science', 'isbn': '978-0-13-359162-0', 'quantity': 2,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.5, 'popularity': 89, 'ai_score': 87, 'org_id': mit.id
            },
            {
                'title': 'Clean Code: A Handbook of Agile Software Craftsmanship', 'author': 'Robert C. Martin',
                'category': 'Software Engineering', 'isbn': '978-0-13-235088-4', 'quantity': 5,
                'cover_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
                'rating': 4.9, 'popularity': 240, 'ai_score': 98, 'org_id': mit.id
            },
            {
                'title': 'Introduction to Algorithms', 'author': 'Thomas H. Cormen',
                'category': 'Computer Science', 'isbn': '978-0-262-03384-8', 'quantity': 1,
                'cover_url': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400',
                'rating': 4.8, 'popularity': 156, 'ai_score': 95, 'org_id': mit.id
            },
            # Vance Books
            {
                'title': 'A Brief History of Time', 'author': 'Stephen Hawking',
                'category': 'Physics', 'isbn': '978-0-553-38016-3', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400',
                'rating': 4.6, 'popularity': 112, 'ai_score': 91, 'org_id': vance.id
            },
            {
                'title': 'The Great Gatsby', 'author': 'F. Scott Fitzgerald',
                'category': 'Literature', 'isbn': '978-0-7432-7356-5', 'quantity': 6,
                'cover_url': 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
                'rating': 4.4, 'popularity': 188, 'ai_score': 82, 'org_id': vance.id
            },
            {
                'title': 'Principles of Quantum Mechanics', 'author': 'R. Shankar',
                'category': 'Physics', 'isbn': '978-0-306-44790-7', 'quantity': 2,
                'cover_url': 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=400',
                'rating': 4.3, 'popularity': 67, 'ai_score': 79, 'org_id': vance.id
            },
            {
                'title': 'Business Analytics: Methods, Models, and Decisions', 'author': 'James R. Evans',
                'category': 'Finance', 'isbn': '978-0-13-295061-9', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
                'rating': 4.6, 'popularity': 95, 'ai_score': 89, 'org_id': vance.id
            }
        ]

        books = []
        for bd in books_data:
            book = Book(
                title=bd['title'],
                author=bd['author'],
                category=bd['category'],
                isbn=bd['isbn'],
                quantity=bd['quantity'],
                availability=bd['quantity'] > 0,
                cover_url=bd['cover_url'],
                rating=bd['rating'],
                popularity=bd['popularity'],
                ai_recommendation_score=bd['ai_score'],
                org_id=bd['org_id']
            )
            db.session.add(book)
            books.append(book)

        db.session.commit()

        # 4. SEED CIRCULATION & FINES (MIT)
        # Issue 1: Overdue book for John Doe (MIT)
        issue1 = Issue(
            book_id=books[0].id, # Architecture of Open Source
            member_id=student_john.id,
            issue_date=datetime.utcnow() - timedelta(days=20),
            due_date=datetime.utcnow() - timedelta(days=6),
            status='overdue',
            fine_amount=30.0,
            org_id=mit.id
        )
        db.session.add(issue1)
        
        # Fine record linked to issue1
        fine1 = Fine(
            issue=issue1,
            member_id=student_john.id,
            amount=30.0,
            status='pending',
            org_id=mit.id
        )
        db.session.add(fine1)

        # Issue 2: Settle cleared checkouts (MIT)
        issue2 = Issue(
            book_id=books[1].id, # Modern OS
            member_id=student_john.id,
            issue_date=datetime.utcnow() - timedelta(days=12),
            due_date=datetime.utcnow() + timedelta(days=2),
            status='issued',
            org_id=mit.id
        )
        db.session.add(issue2)

        # 5. SEED CIRCULATION & FINES (Vance)
        # Issue 3: Settle checkout for Alice (Vance)
        issue3 = Issue(
            book_id=books[7].id, # Business Analytics
            member_id=student_alice.id,
            issue_date=datetime.utcnow() - timedelta(days=5),
            due_date=datetime.utcnow() + timedelta(days=9),
            status='issued',
            org_id=vance.id
        )
        db.session.add(issue3)

        # 6. SEED RESERVATIONS
        res1 = Reservation(
            book_id=books[3].id, # Algorithms
            member_id=student_john.id,
            status='pending',
            org_id=mit.id
        )
        db.session.add(res1)
        
        res2 = Reservation(
            book_id=books[4].id, # History of Time
            member_id=student_alice.id,
            status='pending',
            org_id=vance.id
        )
        db.session.add(res2)

        # 7. SEED AUDIT LOGS
        logs_data = [
            {"user_id": super_admin.id, "action": "Server Startup", "details": "Master SaaS system nodes initialized successfully.", "ip": "127.0.0.1", "browser": "Python System Event"},
            {"user_id": super_admin.id, "action": "Organization Registered", "details": "Registered 'MIT Tech Institute'.", "ip": "127.0.0.1", "browser": "Python System Event"},
            {"user_id": super_admin.id, "action": "Organization Registered", "details": "Registered 'Vance Business School'.", "ip": "127.0.0.1", "browser": "Python System Event"},
            {"user_id": mit_admin.id, "action": "Settings Updated", "details": "Updated MIT parameters and fine rates.", "ip": "192.168.1.55", "browser": "Mozilla/5.0"},
            {"user_id": mit_lib.id, "action": "Book Check Out", "details": "Issued 'The Architecture of Open Source Applications' to john_doe.", "ip": "192.168.1.60", "browser": "Chrome/114.0"},
        ]

        for ld in logs_data:
            log = AuditLog(
                user_id=ld['user_id'],
                action=ld['action'],
                details=ld['details'],
                ip_address=ld['ip'],
                browser=ld['browser']
            )
            db.session.add(log)

        db.session.commit()
        print("SEED SUCCESS: 2 Organizations, 6 Users, 8 Books, 3 Checkouts, 2 Reservations, and 5 Audit Trails created.")

if __name__ == '__main__':
    seed_database()
