import os
import sys
import sqlite3

# Adjust path to import correctly if needed, but we can do it via standard python sqlite3 to be completely independent and robust.
base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, 'instance', 'nova_library_x.db')

def append_new_books():
    print(f"Connecting to database at {db_path}...")
    if not os.path.exists(db_path):
        print(f"CRITICAL ERROR: Database file not found at {db_path}.")
        sys.exit(1)
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Fetch organization ID for MIT
    cursor.execute("SELECT id FROM organizations WHERE subdomain = 'mit' LIMIT 1")
    row = cursor.fetchone()
    if not row:
        print("CRITICAL ERROR: Organization 'mit' not found in database.")
        sys.exit(1)
    mit_org_id = row[0]
    print(f"Found MIT Organization ID: {mit_org_id}")
    
    # 2. Define the 25 new B.Tech-related books
    new_books = [
        {
            "title": "Introduction to Algorithms (4th Edition)",
            "author": "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
            "category": "Computer Science",
            "isbn": "978-0-262-04630-5",
            "quantity": 5,
            "cover_url": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400",
            "rating": 4.8,
            "popularity": 156,
            "ai_score": 95,
            "org_id": mit_org_id,
            "publisher": "MIT Press",
            "edition": "2022",
            "shelf_number": "CS-01",
            "rack_number": "R-1",
            "floor": "1st Floor",
            "subject": "Algorithms & Data Structures"
        },
        {
            "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
            "author": "Robert C. Martin",
            "category": "Software Engineering",
            "isbn": "978-0-13-235088-5",
            "quantity": 4,
            "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
            "rating": 4.9,
            "popularity": 240,
            "ai_score": 98,
            "org_id": mit_org_id,
            "publisher": "Prentice Hall",
            "edition": "2008",
            "shelf_number": "SE-02",
            "rack_number": "R-1",
            "floor": "1st Floor",
            "subject": "Agile Programming Standards"
        },
        {
            "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
            "author": "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
            "category": "Software Engineering",
            "isbn": "978-0-201-63361-0",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.8,
            "popularity": 180,
            "ai_score": 96,
            "org_id": mit_org_id,
            "publisher": "Addison-Wesley",
            "edition": "1994",
            "shelf_number": "SE-03",
            "rack_number": "R-1",
            "floor": "1st Floor",
            "subject": "OOP Design Patterns"
        },
        {
            "title": "Computer Networks (5th Edition)",
            "author": "Andrew S. Tanenbaum, David J. Wetherall",
            "category": "Computer Science",
            "isbn": "978-0-13-212695-3",
            "quantity": 4,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.6,
            "popularity": 110,
            "ai_score": 89,
            "org_id": mit_org_id,
            "publisher": "Pearson",
            "edition": "2011",
            "shelf_number": "NW-01",
            "rack_number": "R-2",
            "floor": "1st Floor",
            "subject": "Network Architecture & Protocols"
        },
        {
            "title": "Operating System Concepts (10th Edition)",
            "author": "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
            "category": "Computer Science",
            "isbn": "978-1-118-06333-0",
            "quantity": 5,
            "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
            "rating": 4.7,
            "popularity": 130,
            "ai_score": 92,
            "org_id": mit_org_id,
            "publisher": "Wiley",
            "edition": "2018",
            "shelf_number": "OS-02",
            "rack_number": "R-2",
            "floor": "1st Floor",
            "subject": "OS Fundamentals & Theory"
        },
        {
            "title": "Database System Concepts (7th Edition)",
            "author": "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
            "category": "Computer Science",
            "isbn": "978-0-07-352330-9",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.5,
            "popularity": 95,
            "ai_score": 88,
            "org_id": mit_org_id,
            "publisher": "McGraw-Hill",
            "edition": "2019",
            "shelf_number": "DB-01",
            "rack_number": "R-3",
            "floor": "1st Floor",
            "subject": "RDBMS & SQL Processing"
        },
        {
            "title": "Artificial Intelligence: A Modern Approach (4th Edition)",
            "author": "Stuart Russell, Peter Norvig",
            "category": "Artificial Intelligence",
            "isbn": "978-0-13-604259-4",
            "quantity": 2,
            "cover_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400",
            "rating": 4.9,
            "popularity": 140,
            "ai_score": 97,
            "org_id": mit_org_id,
            "publisher": "Pearson",
            "edition": "2020",
            "shelf_number": "AI-01",
            "rack_number": "R-4",
            "floor": "2nd Floor",
            "subject": "Intelligent Agents & Logic"
        },
        {
            "title": "Machine Learning",
            "author": "Tom M. Mitchell",
            "category": "Artificial Intelligence",
            "isbn": "978-0-07-042807-2",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.4,
            "popularity": 75,
            "ai_score": 85,
            "org_id": mit_org_id,
            "publisher": "McGraw-Hill",
            "edition": "1997",
            "shelf_number": "ML-01",
            "rack_number": "R-4",
            "floor": "2nd Floor",
            "subject": "Algorithms & Paradigms"
        },
        {
            "title": "Deep Learning",
            "author": "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
            "category": "Artificial Intelligence",
            "isbn": "978-0-262-03561-3",
            "quantity": 4,
            "cover_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400",
            "rating": 4.8,
            "popularity": 120,
            "ai_score": 93,
            "org_id": mit_org_id,
            "publisher": "MIT Press",
            "edition": "2016",
            "shelf_number": "DL-01",
            "rack_number": "R-4",
            "floor": "2nd Floor",
            "subject": "Neural Networks theory"
        },
        {
            "title": "Computer Organization and Design",
            "author": "David A. Patterson, John L. Hennessy",
            "category": "Computer Science",
            "isbn": "978-0-12-407726-3",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400",
            "rating": 4.6,
            "popularity": 85,
            "ai_score": 87,
            "org_id": mit_org_id,
            "publisher": "Morgan Kaufmann",
            "edition": "2013",
            "shelf_number": "CO-01",
            "rack_number": "R-5",
            "floor": "2nd Floor",
            "subject": "MIPS/RISC Architecture"
        },
        {
            "title": "Compilers: Principles, Techniques, and Tools",
            "author": "Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman",
            "category": "Computer Science",
            "isbn": "978-0-321-48681-3",
            "quantity": 2,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.5,
            "popularity": 70,
            "ai_score": 83,
            "org_id": mit_org_id,
            "publisher": "Addison-Wesley",
            "edition": "2006",
            "shelf_number": "CP-01",
            "rack_number": "R-5",
            "floor": "2nd Floor",
            "subject": "Lexical Analysis & Parsing"
        },
        {
            "title": "Software Engineering (10th Edition)",
            "author": "Ian Sommerville",
            "category": "Software Engineering",
            "isbn": "978-0-13-394303-0",
            "quantity": 4,
            "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
            "rating": 4.5,
            "popularity": 115,
            "ai_score": 89,
            "org_id": mit_org_id,
            "publisher": "Pearson",
            "edition": "2015",
            "shelf_number": "SE-04",
            "rack_number": "R-1",
            "floor": "1st Floor",
            "subject": "Systems Lifecycle Planning"
        },
        {
            "title": "The Pragmatic Programmer: Your Journey to Mastery",
            "author": "David Thomas, Andrew Hunt",
            "category": "Software Engineering",
            "isbn": "978-0-13-595705-9",
            "quantity": 5,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.9,
            "popularity": 210,
            "ai_score": 96,
            "org_id": mit_org_id,
            "publisher": "Addison-Wesley",
            "edition": "2019",
            "shelf_number": "SE-05",
            "rack_number": "R-1",
            "floor": "1st Floor",
            "subject": "Career Software Development"
        },
        {
            "title": "Java: The Complete Reference (11th Edition)",
            "author": "Herbert Schildt",
            "category": "Computer Science",
            "isbn": "978-1-26-044023-2",
            "quantity": 6,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.7,
            "popularity": 165,
            "ai_score": 91,
            "org_id": mit_org_id,
            "publisher": "McGraw-Hill",
            "edition": "2018",
            "shelf_number": "JV-01",
            "rack_number": "R-6",
            "floor": "2nd Floor",
            "subject": "Java Language Reference"
        },
        {
            "title": "Python Crash Course (2nd Edition)",
            "author": "Eric Matthes",
            "category": "Computer Science",
            "isbn": "978-1-59327-603-4",
            "quantity": 5,
            "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
            "rating": 4.8,
            "popularity": 195,
            "ai_score": 94,
            "org_id": mit_org_id,
            "publisher": "No Starch Press",
            "edition": "2019",
            "shelf_number": "PY-01",
            "rack_number": "R-6",
            "floor": "2nd Floor",
            "subject": "Practical Python Programming"
        },
        {
            "title": "The C Programming Language (2nd Edition)",
            "author": "Brian W. Kernighan, Dennis M. Ritchie",
            "category": "Computer Science",
            "isbn": "978-0-13-110362-7",
            "quantity": 4,
            "cover_url": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=400",
            "rating": 4.8,
            "popularity": 150,
            "ai_score": 90,
            "org_id": mit_org_id,
            "publisher": "Prentice Hall",
            "edition": "1988",
            "shelf_number": "CL-01",
            "rack_number": "R-6",
            "floor": "2nd Floor",
            "subject": "Standard C Syntax Reference"
        },
        {
            "title": "Data Communications and Networking (5th Edition)",
            "author": "Behrouz A. Forouzan",
            "category": "Computer Science",
            "isbn": "978-0-07-337622-6",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.5,
            "popularity": 80,
            "ai_score": 84,
            "org_id": mit_org_id,
            "publisher": "McGraw-Hill",
            "edition": "2012",
            "shelf_number": "NW-02",
            "rack_number": "R-2",
            "floor": "1st Floor",
            "subject": "Data Comms & Signal flow"
        },
        {
            "title": "Discrete Mathematics and Its Applications",
            "author": "Kenneth H. Rosen",
            "category": "Mathematics",
            "isbn": "978-0-07-338309-5",
            "quantity": 4,
            "cover_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400",
            "rating": 4.6,
            "popularity": 105,
            "ai_score": 86,
            "org_id": mit_org_id,
            "publisher": "McGraw-Hill",
            "edition": "2018",
            "shelf_number": "MA-01",
            "rack_number": "R-7",
            "floor": "2nd Floor",
            "subject": "Discrete Structures Logic"
        },
        {
            "title": "Digital Design (6th Edition)",
            "author": "M. Morris Mano, Michael D. Ciletti",
            "category": "Electrical Engineering",
            "isbn": "978-0-13-198926-9",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
            "rating": 4.4,
            "popularity": 65,
            "ai_score": 81,
            "org_id": mit_org_id,
            "publisher": "Pearson",
            "edition": "2017",
            "shelf_number": "EE-01",
            "rack_number": "R-8",
            "floor": "3rd Floor",
            "subject": "Digital Logic Gate Circuits"
        },
        {
            "title": "Cloud Computing: Concepts, Technology & Architecture",
            "author": "Thomas Erl, Ricardo Puttini, Zaigham Mahmood",
            "category": "Computer Science",
            "isbn": "978-0-13-340731-0",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400",
            "rating": 4.6,
            "popularity": 90,
            "ai_score": 88,
            "org_id": mit_org_id,
            "publisher": "Prentice Hall",
            "edition": "2013",
            "shelf_number": "CC-01",
            "rack_number": "R-3",
            "floor": "1st Floor",
            "subject": "SaaS and Cloud Architectures"
        },
        {
            "title": "Cybersecurity Essentials",
            "author": "Charles J. Brooks, Christopher Grow, Philip Craig",
            "category": "Computer Science",
            "isbn": "978-1-4398-9323-4",
            "quantity": 4,
            "cover_url": "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400",
            "rating": 4.7,
            "popularity": 110,
            "ai_score": 90,
            "org_id": mit_org_id,
            "publisher": "Sybex",
            "edition": "2018",
            "shelf_number": "CS-02",
            "rack_number": "R-9",
            "floor": "3rd Floor",
            "subject": "Network Security Audits"
        },
        {
            "title": "Computer Graphics using OpenGL (3rd Edition)",
            "author": "Francis S. Hill, Stephen M. Kelley",
            "category": "Computer Science",
            "isbn": "978-0-13-149670-5",
            "quantity": 2,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.3,
            "popularity": 55,
            "ai_score": 79,
            "org_id": mit_org_id,
            "publisher": "Pearson",
            "edition": "2007",
            "shelf_number": "CG-01",
            "rack_number": "R-9",
            "floor": "3rd Floor",
            "subject": "3D Renderings & OpenGL"
        },
        {
            "title": "Unix Concepts and Applications",
            "author": "Sumitabha Das",
            "category": "Computer Science",
            "isbn": "978-0-07-063546-4",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
            "rating": 4.5,
            "popularity": 85,
            "ai_score": 82,
            "org_id": mit_org_id,
            "publisher": "McGraw-Hill",
            "edition": "2006",
            "shelf_number": "UX-01",
            "rack_number": "R-6",
            "floor": "2nd Floor",
            "subject": "Unix Shell Scripting"
        },
        {
            "title": "Web Technologies",
            "author": "Uttam K. Roy",
            "category": "Computer Science",
            "isbn": "978-0-19-806622-4",
            "quantity": 4,
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
            "rating": 4.6,
            "popularity": 98,
            "ai_score": 88,
            "org_id": mit_org_id,
            "publisher": "Oxford University Press",
            "edition": "2010",
            "shelf_number": "WT-01",
            "rack_number": "R-3",
            "floor": "1st Floor",
            "subject": "HTML, JS & Server APIs"
        },
        {
            "title": "Internet of Things: A Hands-On Approach",
            "author": "Arshdeep Bahga, Vijay Madisetti",
            "category": "Computer Science",
            "isbn": "978-0-9960255-1-5",
            "quantity": 3,
            "cover_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400",
            "rating": 4.7,
            "popularity": 102,
            "ai_score": 91,
            "org_id": mit_org_id,
            "publisher": "VPT",
            "edition": "2014",
            "shelf_number": "IT-01",
            "rack_number": "R-3",
            "floor": "1st Floor",
            "subject": "Sensors and IoT Architectures"
        }
    ]
    
    # 3. Insert loop
    appended_count = 0
    skipped_count = 0
    for book in new_books:
        # Check if ISBN already exists
        cursor.execute("SELECT id FROM books WHERE isbn = ? LIMIT 1", (book["isbn"],))
        existing = cursor.fetchone()
        if existing:
            print(f"Skipping existing book: '{book['title']}' (ISBN: {book['isbn']})")
            skipped_count += 1
            continue
            
        cursor.execute("""
            INSERT INTO books (
                title, author, category, isbn, availability, quantity, cover_url, 
                rating, popularity, ai_recommendation_score, org_id, publisher, 
                edition, shelf_number, rack_number, floor, subject,
                is_digital, allow_download, lost_copies, damaged_copies, repair_copies, replacement_cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0, 0, 0, 0.0)
        """, (
            book["title"], book["author"], book["category"], book["isbn"], 
            book["quantity"] > 0, book["quantity"], book["cover_url"], 
            book["rating"], book["popularity"], book["ai_score"], book["org_id"], 
            book["publisher"], book["edition"], book["shelf_number"], 
            book["rack_number"], book["floor"], book["subject"]
        ))
        print(f"Appended: '{book['title']}'")
        appended_count += 1
        
    conn.commit()
    conn.close()
    print("--------------------------------------------------")
    print(f"DATABASE UPDATE SUMMARY: Appended {appended_count} new books, skipped {skipped_count} duplicates.")
    print("--------------------------------------------------")

if __name__ == '__main__':
    append_new_books()
