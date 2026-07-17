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
            late_return_risk='Low',
            full_name='John Doe',
            roll_number='MIT-CS-2024-042',
            academic_year='Senior Year (4th)',
            expiry_date='2027-06-30',
            emergency_contact='+1 (617) 555-0199'
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
            late_return_risk='Medium',
            full_name='Alice Smith',
            roll_number='VANCE-FB-2023-118',
            academic_year='Junior Year (3rd)',
            expiry_date='2028-05-31',
            emergency_contact='+1 (212) 555-0244'
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
            },
            # 25 B.Tech books
            {
                'title': 'Introduction to Algorithms (4th Edition)', 'author': 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
                'category': 'Computer Science', 'isbn': '978-0-262-04630-5', 'quantity': 5,
                'cover_url': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400',
                'rating': 4.8, 'popularity': 156, 'ai_score': 95, 'org_id': mit.id,
                'publisher': 'MIT Press', 'edition': '2022', 'shelf_number': 'CS-01', 'rack_number': 'R-1', 'floor': '1st Floor', 'subject': 'Algorithms & Data Structures',
                'is_digital': True, 'pdf_url': '/books/algorithms.pdf'
            },
            {
                'title': 'Clean Code: A Handbook of Agile Software Craftsmanship', 'author': 'Robert C. Martin',
                'category': 'Software Engineering', 'isbn': '978-0-13-235088-5', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
                'rating': 4.9, 'popularity': 240, 'ai_score': 98, 'org_id': mit.id,
                'publisher': 'Prentice Hall', 'edition': '2008', 'shelf_number': 'SE-02', 'rack_number': 'R-1', 'floor': '1st Floor', 'subject': 'Agile Programming Standards',
                'is_digital': True, 'pdf_url': '/books/cleancode.pdf'
            },
            {
                'title': 'Design Patterns: Elements of Reusable Object-Oriented Software', 'author': 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
                'category': 'Software Engineering', 'isbn': '978-0-201-63361-0', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.8, 'popularity': 180, 'ai_score': 96, 'org_id': mit.id,
                'publisher': 'Addison-Wesley', 'edition': '1994', 'shelf_number': 'SE-03', 'rack_number': 'R-1', 'floor': '1st Floor', 'subject': 'OOP Design Patterns'
            },
            {
                'title': 'Computer Networks (5th Edition)', 'author': 'Andrew S. Tanenbaum, David J. Wetherall',
                'category': 'Computer Science', 'isbn': '978-0-13-212695-3', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.6, 'popularity': 110, 'ai_score': 89, 'org_id': mit.id,
                'publisher': 'Pearson', 'edition': '2011', 'shelf_number': 'NW-01', 'rack_number': 'R-2', 'floor': '1st Floor', 'subject': 'Network Architecture & Protocols',
                'is_digital': True, 'pdf_url': '/books/computernetworks.pdf'
            },
            {
                'title': 'Operating System Concepts (10th Edition)', 'author': 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
                'category': 'Computer Science', 'isbn': '978-1-118-06333-0', 'quantity': 5,
                'cover_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
                'rating': 4.7, 'popularity': 130, 'ai_score': 92, 'org_id': mit.id,
                'publisher': 'Wiley', 'edition': '2018', 'shelf_number': 'OS-02', 'rack_number': 'R-2', 'floor': '1st Floor', 'subject': 'OS Fundamentals & Theory',
                'is_digital': True, 'pdf_url': '/books/operatingsystems.pdf'
            },
            {
                'title': 'Database System Concepts (7th Edition)', 'author': 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
                'category': 'Computer Science', 'isbn': '978-0-07-352330-9', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.5, 'popularity': 95, 'ai_score': 88, 'org_id': mit.id,
                'publisher': 'McGraw-Hill', 'edition': '2019', 'shelf_number': 'DB-01', 'rack_number': 'R-3', 'floor': '1st Floor', 'subject': 'RDBMS & SQL Processing',
                'is_digital': True, 'pdf_url': '/books/databasesystems.pdf'
            },
            {
                'title': 'Artificial Intelligence: A Modern Approach (4th Edition)', 'author': 'Stuart Russell, Peter Norvig',
                'category': 'Artificial Intelligence', 'isbn': '978-0-13-604259-4', 'quantity': 2,
                'cover_url': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
                'rating': 4.9, 'popularity': 140, 'ai_score': 97, 'org_id': mit.id,
                'publisher': 'Pearson', 'edition': '2020', 'shelf_number': 'AI-01', 'rack_number': 'R-4', 'floor': '2nd Floor', 'subject': 'Intelligent Agents & Logic'
            },
            {
                'title': 'Machine Learning', 'author': 'Tom M. Mitchell',
                'category': 'Artificial Intelligence', 'isbn': '978-0-07-042807-2', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.4, 'popularity': 75, 'ai_score': 85, 'org_id': mit.id,
                'publisher': 'McGraw-Hill', 'edition': '1997', 'shelf_number': 'ML-01', 'rack_number': 'R-4', 'floor': '2nd Floor', 'subject': 'Algorithms & Paradigms'
            },
            {
                'title': 'Deep Learning', 'author': 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
                'category': 'Artificial Intelligence', 'isbn': '978-0-262-03561-3', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400',
                'rating': 4.8, 'popularity': 120, 'ai_score': 93, 'org_id': mit.id,
                'publisher': 'MIT Press', 'edition': '2016', 'shelf_number': 'DL-01', 'rack_number': 'R-4', 'floor': '2nd Floor', 'subject': 'Neural Networks theory'
            },
            {
                'title': 'Computer Organization and Design', 'author': 'David A. Patterson, John L. Hennessy',
                'category': 'Computer Science', 'isbn': '978-0-12-407726-3', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400',
                'rating': 4.6, 'popularity': 85, 'ai_score': 87, 'org_id': mit.id,
                'publisher': 'Morgan Kaufmann', 'edition': '2013', 'shelf_number': 'CO-01', 'rack_number': 'R-5', 'floor': '2nd Floor', 'subject': 'MIPS/RISC Architecture'
            },
            {
                'title': 'Compilers: Principles, Techniques, and Tools', 'author': 'Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman',
                'category': 'Computer Science', 'isbn': '978-0-321-48681-3', 'quantity': 2,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.5, 'popularity': 70, 'ai_score': 83, 'org_id': mit.id,
                'publisher': 'Addison-Wesley', 'edition': '2006', 'shelf_number': 'CP-01', 'rack_number': 'R-5', 'floor': '2nd Floor', 'subject': 'Lexical Analysis & Parsing'
            },
            {
                'title': 'Software Engineering (10th Edition)', 'author': 'Ian Sommerville',
                'category': 'Software Engineering', 'isbn': '978-0-13-394303-0', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
                'rating': 4.5, 'popularity': 115, 'ai_score': 89, 'org_id': mit.id,
                'publisher': 'Pearson', 'edition': '2015', 'shelf_number': 'SE-04', 'rack_number': 'R-1', 'floor': '1st Floor', 'subject': 'Systems Lifecycle Planning'
            },
            {
                'title': 'The Pragmatic Programmer: Your Journey to Mastery', 'author': 'David Thomas, Andrew Hunt',
                'category': 'Software Engineering', 'isbn': '978-0-13-595705-9', 'quantity': 5,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.9, 'popularity': 210, 'ai_score': 96, 'org_id': mit.id,
                'publisher': 'Addison-Wesley', 'edition': '2019', 'shelf_number': 'SE-05', 'rack_number': 'R-1', 'floor': '1st Floor', 'subject': 'Career Software Development'
            },
            {
                'title': 'Java: The Complete Reference (11th Edition)', 'author': 'Herbert Schildt',
                'category': 'Computer Science', 'isbn': '978-1-26-044023-2', 'quantity': 6,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.7, 'popularity': 165, 'ai_score': 91, 'org_id': mit.id,
                'publisher': 'McGraw-Hill', 'edition': '2018', 'shelf_number': 'JV-01', 'rack_number': 'R-6', 'floor': '2nd Floor', 'subject': 'Java Language Reference'
            },
            {
                'title': 'Python Crash Course (2nd Edition)', 'author': 'Eric Matthes',
                'category': 'Computer Science', 'isbn': '978-1-59327-603-4', 'quantity': 5,
                'cover_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
                'rating': 4.8, 'popularity': 195, 'ai_score': 94, 'org_id': mit.id,
                'publisher': 'No Starch Press', 'edition': '2019', 'shelf_number': 'PY-01', 'rack_number': 'R-6', 'floor': '2nd Floor', 'subject': 'Practical Python Programming'
            },
            {
                'title': 'The C Programming Language (2nd Edition)', 'author': 'Brian W. Kernighan, Dennis M. Ritchie',
                'category': 'Computer Science', 'isbn': '978-0-13-110362-7', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400',
                'rating': 4.8, 'popularity': 150, 'ai_score': 90, 'org_id': mit.id,
                'publisher': 'Prentice Hall', 'edition': '1988', 'shelf_number': 'CL-01', 'rack_number': 'R-6', 'floor': '2nd Floor', 'subject': 'Standard C Syntax Reference'
            },
            {
                'title': 'Data Communications and Networking (5th Edition)', 'author': 'Behrouz A. Forouzan',
                'category': 'Computer Science', 'isbn': '978-0-07-337622-6', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.5, 'popularity': 80, 'ai_score': 84, 'org_id': mit.id,
                'publisher': 'McGraw-Hill', 'edition': '2012', 'shelf_number': 'NW-02', 'rack_number': 'R-2', 'floor': '1st Floor', 'subject': 'Data Comms & Signal flow'
            },
            {
                'title': 'Discrete Mathematics and Its Applications', 'author': 'Kenneth H. Rosen',
                'category': 'Mathematics', 'isbn': '978-0-07-338309-5', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
                'rating': 4.6, 'popularity': 105, 'ai_score': 86, 'org_id': mit.id,
                'publisher': 'McGraw-Hill', 'edition': '2018', 'shelf_number': 'MA-01', 'rack_number': 'R-7', 'floor': '2nd Floor', 'subject': 'Discrete Structures Logic'
            },
            {
                'title': 'Digital Design (6th Edition)', 'author': 'M. Morris Mano, Michael D. Ciletti',
                'category': 'Electrical Engineering', 'isbn': '978-0-13-198926-9', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
                'rating': 4.4, 'popularity': 65, 'ai_score': 81, 'org_id': mit.id,
                'publisher': 'Pearson', 'edition': '2017', 'shelf_number': 'EE-01', 'rack_number': 'R-8', 'floor': '3rd Floor', 'subject': 'Digital Logic Gate Circuits'
            },
            {
                'title': 'Cloud Computing: Concepts, Technology & Architecture', 'author': 'Thomas Erl, Ricardo Puttini, Zaigham Mahmood',
                'category': 'Computer Science', 'isbn': '978-0-13-340731-0', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400',
                'rating': 4.6, 'popularity': 90, 'ai_score': 88, 'org_id': mit.id,
                'publisher': 'Prentice Hall', 'edition': '2013', 'shelf_number': 'CC-01', 'rack_number': 'R-3', 'floor': '1st Floor', 'subject': 'SaaS and Cloud Architectures'
            },
            {
                'title': 'Cybersecurity Essentials', 'author': 'Charles J. Brooks, Christopher Grow, Philip Craig',
                'category': 'Computer Science', 'isbn': '978-1-4398-9323-4', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
                'rating': 4.7, 'popularity': 110, 'ai_score': 90, 'org_id': mit.id,
                'publisher': 'Sybex', 'edition': '2018', 'shelf_number': 'CS-02', 'rack_number': 'R-9', 'floor': '3rd Floor', 'subject': 'Network Security Audits'
            },
            {
                'title': 'Computer Graphics using OpenGL (3rd Edition)', 'author': 'Francis S. Hill, Stephen M. Kelley',
                'category': 'Computer Science', 'isbn': '978-0-13-149670-5', 'quantity': 2,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.3, 'popularity': 55, 'ai_score': 79, 'org_id': mit.id,
                'publisher': 'Pearson', 'edition': '2007', 'shelf_number': 'CG-01', 'rack_number': 'R-9', 'floor': '3rd Floor', 'subject': '3D Renderings & OpenGL'
            },
            {
                'title': 'Unix Concepts and Applications', 'author': 'Sumitabha Das',
                'category': 'Computer Science', 'isbn': '978-0-07-063546-4', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
                'rating': 4.5, 'popularity': 85, 'ai_score': 82, 'org_id': mit.id,
                'publisher': 'McGraw-Hill', 'edition': '2006', 'shelf_number': 'UX-01', 'rack_number': 'R-6', 'floor': '2nd Floor', 'subject': 'Unix Shell Scripting'
            },
            {
                'title': 'Web Technologies', 'author': 'Uttam K. Roy',
                'category': 'Computer Science', 'isbn': '978-0-19-806622-4', 'quantity': 4,
                'cover_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
                'rating': 4.6, 'popularity': 98, 'ai_score': 88, 'org_id': mit.id,
                'publisher': 'Oxford University Press', 'edition': '2010', 'shelf_number': 'WT-01', 'rack_number': 'R-3', 'floor': '1st Floor', 'subject': 'HTML, JS & Server APIs'
            },
            {
                'title': 'Internet of Things: A Hands-On Approach', 'author': 'Arshdeep Bahga, Vijay Madisetti',
                'category': 'Computer Science', 'isbn': '978-0-9960255-1-5', 'quantity': 3,
                'cover_url': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400',
                'rating': 4.7, 'popularity': 102, 'ai_score': 91, 'org_id': mit.id,
                'publisher': 'VPT', 'edition': '2014', 'shelf_number': 'IT-01', 'rack_number': 'R-3', 'floor': '1st Floor', 'subject': 'Sensors and IoT Architectures'
            }
        ]

        import re
        books = []
        for bd in books_data:
            slug = re.sub(r'[^a-z0-9]', '_', bd['title'].lower())
            pdf_url = bd.get('pdf_url') or f"/books/pdfs/{slug}.pdf"
            
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
                org_id=bd['org_id'],
                publisher=bd.get('publisher'),
                edition=bd.get('edition'),
                shelf_number=bd.get('shelf_number'),
                rack_number=bd.get('rack_number'),
                floor=bd.get('floor'),
                subject=bd.get('subject'),
                is_digital=True,
                pdf_url=pdf_url,
                allow_download=True
            )
            
            # Generate the PDF file on seed run
            base_dir = os.path.dirname(os.path.abspath(__file__))
            pdf_path = os.path.join(base_dir, '..', 'frontend', 'public', pdf_url.lstrip('/'))
            os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
            
            if not os.path.exists(pdf_path):
                try:
                    from reportlab.lib.pagesizes import letter
                    from reportlab.pdfgen import canvas
                    
                    c = canvas.Canvas(pdf_path, pagesize=letter)
                    pages = 32
                    title = book.title
                    author = book.author
                    
                    for page_num in range(1, pages + 1):
                        c.setFont("Helvetica-Bold", 16)
                        c.drawString(50, 750, title)
                        c.setFont("Helvetica", 10)
                        c.drawString(50, 730, f"By {author}")
                        c.setStrokeColorRGB(0.1, 0.6, 0.8)
                        c.line(50, 720, 550, 720)
                        
                        if page_num == 1:
                            c.setFont("Helvetica-Bold", 24)
                            c.drawCentredString(300, 480, title)
                            c.setFont("Helvetica", 14)
                            c.drawCentredString(300, 440, f"By {author}")
                            c.line(150, 420, 450, 420)
                            c.setFont("Helvetica-Oblique", 11)
                            c.drawCentredString(300, 395, f"Subject: {book.category}")
                            c.drawCentredString(300, 375, f"ISBN: {book.isbn}")
                            c.setFont("Helvetica", 10)
                            c.drawCentredString(300, 150, f"Nova University Academic Publishing, 2024")
                        elif page_num == 2:
                            c.setFont("Helvetica-Bold", 18)
                            c.drawString(50, 680, "Table of Contents")
                            c.setFont("Helvetica", 11)
                            c.drawString(70, 620, "Chapter 1: Elementary Theories & Conceptual Frameworks ....... Page 3")
                            c.drawString(70, 580, "Chapter 2: Core Analytical Methodologies & Models ............. Page 10")
                            c.drawString(70, 540, "Chapter 3: Integration Systems & Practical Case Studies ....... Page 18")
                            c.drawString(70, 500, "Chapter 4: Advanced Systems Performance Optimization ......... Page 27")
                        else:
                            chap_num = (page_num - 3) // 8 + 1
                            c.setFont("Helvetica-Bold", 14)
                            c.drawString(50, 680, f"Chapter {chap_num}: Academic Study Courseware")
                            
                            c.setFont("Helvetica", 11)
                            text_lines = [
                                f"Welcome to Page {page_num} of this textbook resource on {title}.",
                                f"This document is a legally distributable open educational resource (OER).",
                                "Please read through these sections to master the curriculum.",
                                "",
                                "Key learning outcomes for this chapter:",
                                "- Synthesizing theoretical assumptions and mathematical parameters.",
                                "- Analyzing system architecture, input models, and flow controls.",
                                "- Resolving real-world problems through targeted laboratory experiments.",
                                "",
                                "To track your academic metrics, bookmark pages and resume reading,",
                                "your reading session is saved in the Nova LMS real-time sync database.",
                                "If you have any questions, use the integrated AI study assistant node."
                            ]
                            
                            y = 630
                            for line in text_lines:
                                c.drawString(50, y, line)
                                y -= 22
                        
                        c.line(50, 60, 550, 60)
                        c.setFont("Helvetica-Oblique", 8)
                        c.drawString(50, 45, "Nova Integrated Reading Room v2.0 • Digital Library Node")
                        c.drawRightString(550, 45, f"Page {page_num} of {pages}")
                        c.showPage()
                    
                    c.save()
                    print(f"Generated seed PDF: {pdf_path}")
                except Exception as e:
                    print(f"Failed to generate seed PDF: {e}")
            
            db.session.add(book)
            books.append(book)

        db.session.commit()
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
