from backend.models.Book import Book
from backend.models.User import User
from backend.models.Issue import Issue
from backend.models.Reservation import Reservation
from datetime import datetime

class AIService:
    @staticmethod
    def process_prompt(prompt: str, user_role: str, user_id: int = None):
        """
        Parses natural language prompts to perform smart library database lookups,
        returning a conversational response text and optional query action data.
        """
        prompt_lower = prompt.lower()
        
        # 1. FINE ENQUIRY
        if any(word in prompt_lower for word in ["fine", "penalty", "fee", "charge"]):
            if not user_id:
                return {
                    "text": "Please sign in to check your personal library fine accounts.",
                    "type": "info"
                }
            
            issues = Issue.query.filter_by(member_id=user_id).all()
            fine_sum = sum(i.fine_amount for i in issues)
            overdue_items = [i for i in issues if i.status == 'overdue']
            
            if fine_sum <= 0:
                return {
                    "text": "Excellent! You currently have no outstanding library fines. Keep it up! 🌸",
                    "type": "success"
                }
            else:
                return {
                    "text": f"You currently have a total outstanding fine of INR {fine_sum}. Out of this, {len(overdue_items)} checkouts are currently marked as overdue. Please settle them at the lending desk.",
                    "type": "info"
                }

        # 2. RESERVATION ENQUIRY
        elif any(word in prompt_lower for word in ["reservation", "hold", "reserved"]):
            if not user_id:
                return {
                    "text": "Please sign in to check your active library holds.",
                    "type": "info"
                }
                
            holds = Reservation.query.filter_by(member_id=user_id, status='pending').all()
            if not holds:
                return {
                    "text": "You do not have any pending book reservations or holds at the moment.",
                    "type": "success"
                }
            
            hold_titles = ", ".join([h.book.title for h in holds if h.book])
            return {
                "text": f"You have {len(holds)} active reservation holds: {hold_titles}.",
                "type": "info"
            }

        # 3. DUE DATE REMINDER
        elif any(word in prompt_lower for word in ["due date", "deadline", "return date", "when return"]):
            if not user_id:
                return {
                    "text": "Please sign in to check your active borrowing due dates.",
                    "type": "info"
                }
                
            active_issues = Issue.query.filter_by(member_id=user_id, status='issued').all()
            if not active_issues:
                return {
                    "text": "You do not have any actively borrowed books requiring return right now.",
                    "type": "success"
                }
            
            reminders = []
            for issue in active_issues:
                due_str = issue.due_date.strftime('%Y-%m-%d')
                reminders.append(f"'{issue.book.title}' is due by {due_str}")
            
            return {
                "text": "Here is a list of your actively borrowed books and their return deadlines:\n" + "\n".join(reminders),
                "type": "info"
            }

        # 4. BOOK SUMMARIES / EXPLAINERS
        elif any(word in prompt_lower for word in ["summary", "explain", "about the book", "tell me about"]):
            # Extract possible title
            clean_term = prompt_lower
            for stop in ["summary", "explain", "about", "the", "book", "tell", "me", "of"]:
                clean_term = clean_term.replace(stop, "")
            clean_term = clean_term.strip()
            
            if not clean_term:
                return {
                    "text": "Could you tell me which book you would like a summary for? (e.g. 'Explain about the book Quantum Physics')",
                    "type": "info"
                }
                
            book = Book.query.filter(Book.title.ilike(f'%{clean_term}%')).first()
            if not book:
                return {
                    "text": f"I couldn't find a book in our master catalog matching '{clean_term}' to extract a summary for.",
                    "type": "error"
                }
                
            # Construct a dynamic details summary
            summary_txt = f"'{book.title}' is a textbook in the genre of '{book.category}' authored by '{book.author}'. "
            if book.publisher:
                summary_txt += f"Published by {book.publisher}. "
            summary_txt += f"Rating is {book.rating}★ with an AI recommended score of {book.ai_recommendation_score}%. "
            if book.floor or book.rack_number:
                summary_txt += f"Physical location coordinates: Floor {book.floor or '1'}, Rack {book.rack_number or 'A'}, Shelf {book.shelf_number or '1'}."
                
            return {
                "text": summary_txt,
                "type": "books",
                "data": [book.to_dict()]
            }

        # 5. FAQ / HELP MENU
        elif any(word in prompt_lower for word in ["faq", "help", "frequently asked questions"]):
            faq_text = (
                "Here are the Nova Library Frequently Asked Questions:\n\n"
                "1. **How to search books?**\n"
                "Type 'Find books on Python' or use the voice mic button in the Enterprise Hub.\n\n"
                "2. **How to check active fines?**\n"
                "Ask 'Do I have any fines?' to see overdue charges.\n\n"
                "3. **How to track holds?**\n"
                "Ask 'Show my reservations' to view active book holds.\n\n"
                "4. **How to request new books?**\n"
                "Librarians review book requests submitted via the suggestion forms in the dashboard.\n\n"
                "5. **Can I read eBooks?**\n"
                "Yes, select digital titles have a 'Read eBook' button next to them in the catalogue feed."
            )
            return {
                "text": faq_text,
                "type": "info"
            }

        # 6. SEARCH BOOKS BY KEYWORD (ORIGINAL SEARCH)
        elif "find" in prompt_lower or "search" in prompt_lower or "show" in prompt_lower:
            # Extract keyword by removing search terms
            clean_term = prompt_lower
            for stop in ["find", "search", "show", "books", "book", "on", "for", "about"]:
                clean_term = clean_term.replace(stop, "")
            clean_term = clean_term.strip()
            
            if not clean_term:
                return {
                    "text": "I would love to help you find books. Could you please specify a subject or keyword? (e.g. 'Find books on Python')",
                    "type": "info"
                }
                
            # Query Books
            books = Book.query.filter(
                (Book.title.ilike(f'%{clean_term}%')) | 
                (Book.author.ilike(f'%{clean_term}%')) |
                (Book.category.ilike(f'%{clean_term}%'))
            ).all()
            
            if not books:
                return {
                    "text": f"I scanned our entire inventory but couldn't find any books matching '{clean_term}'. Feel free to try another keyword!",
                    "type": "error"
                }
                
            return {
                "text": f"I found {len(books)} books matching '{clean_term}' in our catalog. Here is a list of results:",
                "type": "books",
                "data": [b.to_dict() for b in books]
            }

        # 7. SHOW OVERDUE ACCOUNTS (ADMIN / LIBRARIAN ONLY)
        elif "overdue" in prompt_lower or "late" in prompt_lower:
            if user_role not in ['admin', 'librarian']:
                return {
                    "text": "I'm sorry, details regarding member accounts and overdue notices are restricted to library personnel only.",
                    "type": "warning"
                }
                
            overdue_issues = Issue.query.filter_by(status='overdue').all()
            
            if not overdue_issues:
                return {
                    "text": "Excellent news! There are currently no overdue books in circulation. All active checkouts are within their dates.",
                    "type": "success"
                }
                
            return {
                "text": f"Here is a summary of the {len(overdue_issues)} active overdue accounts requiring attention:",
                "type": "issues",
                "data": [i.to_dict() for i in overdue_issues]
            }

        # 8. POPULAR BOOKS
        elif "popular" in prompt_lower or "recommend" in prompt_lower or "best" in prompt_lower:
            popular_books = Book.query.order_by(Book.popularity.desc()).limit(3).all()
            
            return {
                "text": "Here are the top-trending publications based on reader checkout frequencies and high recommendation indexes:",
                "type": "books",
                "data": [b.to_dict() for b in popular_books]
            }

        # 9. ACTIVE CIRCULATION STATS
        elif "issued today" in prompt_lower or "checked out" in prompt_lower or "circulation" in prompt_lower:
            active_count = Issue.query.filter(Issue.status != 'returned').count()
            
            return {
                "text": f"Currently, there are {active_count} books in active circulation. You can check the detailed logs in the Issued Books tab.",
                "type": "info"
            }

        # 10. GREETING / CHAT
        elif any(word in prompt_lower for word in ["hello", "hi", "hey", "greetings", "helper", "who are you"]):
            return {
                "text": "Hello! I am Nova, your AI Knowledge Companion. 📚✨ I can help you search the library catalog, track overdue notices, check your fines, list reservations, or find summaries. Try asking: 'Find books on Software Engineering' or 'What is my fine?' or 'FAQ'!",
                "type": "info"
              }

        # 11. DEFAULT FALLBACK
        else:
            return {
                "text": "I understand you are asking about '" + prompt + "'. As an AI librarian, I can help you find books, check active holds, look up due dates, or explain summaries. Ask: 'What is my fine?' or 'Show my reservations' or 'FAQ'.",
                "type": "info"
            }
