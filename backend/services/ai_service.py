from backend.models.Book import Book
from backend.models.User import User
from backend.models.Issue import Issue
from datetime import datetime

class AIService:
    @staticmethod
    def process_prompt(prompt: str, user_role: str):
        """
        Parses natural language prompts to perform smart library database lookups,
        returning a conversational response text and optional query action data.
        """
        prompt_lower = prompt.lower()
        
        # 1. SEARCH BOOKS BY KEYWORD
        if "find" in prompt_lower or "search" in prompt_lower or "show" in prompt_lower:
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

        # 2. SHOW OVERDUE ACCOUNTS (ADMIN / LIBRARIAN ONLY)
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

        # 3. POPULAR BOOKS
        elif "popular" in prompt_lower or "recommend" in prompt_lower or "best" in prompt_lower:
            popular_books = Book.query.order_by(Book.popularity.desc()).limit(3).all()
            
            return {
                "text": "Here are the top-trending publications based on reader checkout frequencies and high recommendation indexes:",
                "type": "books",
                "data": [b.to_dict() for b in popular_books]
            }

        # 4. ACTIVE CIRCULATION STATS
        elif "issued today" in prompt_lower or "checked out" in prompt_lower or "circulation" in prompt_lower:
            active_count = Issue.query.filter(Issue.status != 'returned').count()
            
            return {
                "text": f"Currently, there are {active_count} books in active circulation. You can check the detailed logs in the Issued Books tab.",
                "type": "info"
            }

        # 5. GREETING / CHAT
        elif any(word in prompt_lower for word in ["hello", "hi", "hey", "greetings", "helper", "who are you"]):
            return {
                "text": "Hello! I am Nova, your AI Knowledge Companion. 📚✨ I can help you search the library catalog, track overdue notices, look up reading histories, or give you reading recommendations. Try typing: 'Find books on computer science' or 'Recommend a popular book'!",
                "type": "info"
            }

        # 6. DEFAULT FALLBACK
        else:
            return {
                "text": "I understand you are asking about '" + prompt + "'. As an AI librarian, I can help you find books, check accounts, or view reports. Try asking: 'Find books on software engineering' or 'Show me popular books'.",
                "type": "info"
            }
