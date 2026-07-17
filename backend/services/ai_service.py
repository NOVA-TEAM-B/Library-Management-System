import os
import requests
import time
from backend.models.Book import Book
from backend.models.User import User
from backend.models.Issue import Issue
from backend.models.Reservation import Reservation
from datetime import datetime

def query_llm(prompt: str, system_context: str = None) -> str:
    """
    Connects to Google Gemini or OpenAI Chat Completion API to generate answers.
    Uses environment variables for API keys and includes retry logic.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    default_system = (
        "You are Nova, the premium AI Knowledge Companion of Nova Library.\n"
        "You are integrated into the Nova Library Management System.\n"
        "Provide helpful, concise, academic, and technical assistance.\n"
        "Format responses in beautiful Markdown. Use bullet points and code blocks where applicable.\n"
        "If the user asks questions unrelated to books or the library, answer them naturally like a helpful AI assistant."
    )
    
    if system_context:
        system_instruction = f"{default_system}\n\nContext about the user's library accounts/data:\n{system_context}"
    else:
        system_instruction = default_system

    # 1. GOOGLE GEMINI PROVIDER (Preferred)
    if gemini_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": f"System Instructions:\n{system_instruction}\n\nUser Question:\n{prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1200
            }
        }
        
        for attempt in range(3):
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    return text
                else:
                    print(f"Gemini API returned error code {res.status_code}: {res.text}")
            except Exception as e:
                print(f"Gemini request attempt {attempt+1} failed: {e}")
                time.sleep(0.5)

    # 2. OPENAI GPT PROVIDER
    elif openai_key:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_key}"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1200
        }
        
        for attempt in range(3):
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    text = data['choices'][0]['message']['content']
                    return text
                else:
                    print(f"OpenAI API returned error code {res.status_code}: {res.text}")
            except Exception as e:
                print(f"OpenAI request attempt {attempt+1} failed: {e}")
                time.sleep(0.5)

    return None


class AIService:
    @staticmethod
    def process_prompt(prompt: str, user_role: str, user_id: int = None):
        """
        Parses natural language prompts to perform smart library database lookups,
        returning a conversational response text and optional query action data.
        """
        user = User.query.get(user_id) if user_id else None
        org_id = user.org_id if user and user_role != 'superadmin' else None
        
        prompt_lower = prompt.lower()
        db_context = None
        local_type = "info"
        local_data = None
        
        # Static local fallbacks (if LLM is offline or unconfigured)
        fallback_response = None

        # 1. FINE ENQUIRY
        if any(word in prompt_lower for word in ["fine", "penalty", "fee", "charge"]):
            if not user_id:
                db_context = "User is not logged in. Tell them to sign in to check library fines."
                fallback_response = {
                    "text": "Please sign in to check your personal library fine accounts.",
                    "type": "info"
                }
            else:
                issues = Issue.query.filter_by(member_id=user_id).all()
                fine_sum = sum(i.fine_amount for i in issues)
                overdue_items = [i for i in issues if i.status == 'overdue']
                db_context = f"User has INR {fine_sum} outstanding fine. Overdue books count: {len(overdue_items)}."
                local_type = "success" if fine_sum <= 0 else "info"
                
                if fine_sum <= 0:
                    fallback_response = {
                        "text": "Excellent! You currently have no outstanding library fines. Keep it up! 🌸",
                        "type": "success"
                    }
                else:
                    fallback_response = {
                        "text": f"You currently have a total outstanding fine of INR {fine_sum}. Out of this, {len(overdue_items)} checkouts are currently marked as overdue. Please settle them at the lending desk.",
                        "type": "info"
                    }

        # 2. RESERVATION ENQUIRY
        elif any(word in prompt_lower for word in ["reservation", "hold", "reserved"]):
            if not user_id:
                db_context = "User is not logged in. Tell them to sign in to check active holds."
                fallback_response = {
                    "text": "Please sign in to check your active library holds.",
                    "type": "info"
                }
            else:
                holds = Reservation.query.filter_by(member_id=user_id, status='pending').all()
                if not holds:
                    db_context = "User has no pending reservations or holds."
                    local_type = "success"
                    fallback_response = {
                        "text": "You do not have any pending book reservations or holds at the moment.",
                        "type": "success"
                    }
                else:
                    hold_titles = ", ".join([h.book.title for h in holds if h.book])
                    db_context = f"User has {len(holds)} pending reservations: {hold_titles}."
                    local_type = "info"
                    fallback_response = {
                        "text": f"You have {len(holds)} active reservation holds: {hold_titles}.",
                        "type": "info"
                    }

        # 3. DUE DATE REMINDER
        elif any(word in prompt_lower for word in ["due date", "deadline", "return date", "when return"]):
            if not user_id:
                db_context = "User is not logged in. Tell them to sign in to check borrowing due dates."
                fallback_response = {
                    "text": "Please sign in to check your active borrowing due dates.",
                    "type": "info"
                }
            else:
                active_issues = Issue.query.filter_by(member_id=user_id, status='issued').all()
                if not active_issues:
                    db_context = "User has no active borrowed books."
                    local_type = "success"
                    fallback_response = {
                        "text": "You do not have any actively borrowed books requiring return right now.",
                        "type": "success"
                    }
                else:
                    reminders = []
                    for issue in active_issues:
                        due_str = issue.due_date.strftime('%Y-%m-%d')
                        reminders.append(f"'{issue.book.title}' is due by {due_str}")
                    db_context = "User's active checkouts return due dates: " + ", ".join(reminders)
                    local_type = "info"
                    fallback_response = {
                        "text": "Here is a list of your actively borrowed books and their return deadlines:\n" + "\n".join(reminders),
                        "type": "info"
                    }

        # 4. BOOK SUMMARIES / EXPLAINERS
        elif any(word in prompt_lower for word in ["summary", "explain", "about the book", "tell me about"]):
            clean_term = prompt_lower
            for stop in ["summary", "explain", "about", "the", "book", "tell", "me", "of"]:
                clean_term = clean_term.replace(stop, "")
            clean_term = clean_term.strip()
            
            if not clean_term:
                db_context = "User asked for a book summary but didn't specify which book title."
                fallback_response = {
                    "text": "Could you tell me which book you would like a summary for? (e.g. 'Explain about the book Quantum Physics')",
                    "type": "info"
                }
            else:
                book_query = Book.query.filter(Book.title.ilike(f'%{clean_term}%'))
                if org_id is not None:
                    book_query = book_query.filter(Book.org_id == org_id)
                book = book_query.first()
                if not book:
                    db_context = f"Book matching term '{clean_term}' was not found in catalog."
                    local_type = "error"
                    fallback_response = {
                        "text": f"I couldn't find a book in our master catalog matching '{clean_term}' to extract a summary for.",
                        "type": "error"
                    }
                else:
                    db_context = f"Found book details: Title: {book.title}, Author: {book.author}, Category: {book.category}, Publisher: {book.publisher}, Location: Floor {book.floor or '1'}/Rack {book.rack_number or 'A'}/Shelf {book.shelf_number or '1'}."
                    local_type = "books"
                    local_data = [book.to_dict()]
                    
                    summary_txt = f"'{book.title}' is a textbook in the genre of '{book.category}' authored by '{book.author}'. "
                    if book.publisher:
                        summary_txt += f"Published by {book.publisher}. "
                    summary_txt += f"Rating is {book.rating}★ with an AI recommended score of {book.ai_recommendation_score}%. "
                    if book.floor or book.rack_number:
                        summary_txt += f"Physical location coordinates: Floor {book.floor or '1'}, Rack {book.rack_number or 'A'}, Shelf {book.shelf_number or '1'}."
                    
                    fallback_response = {
                        "text": summary_txt,
                        "type": "books",
                        "data": local_data
                    }

        # 5. FAQ / HELP MENU
        elif any(word in prompt_lower for word in ["faq", "help", "frequently asked questions"]):
            db_context = "User requested general help / FAQ information."
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
            fallback_response = {
                "text": faq_text,
                "type": "info"
            }

        # 6. SEARCH BOOKS BY KEYWORD
        elif "find" in prompt_lower or "search" in prompt_lower or "show" in prompt_lower:
            clean_term = prompt_lower
            for stop in ["find", "search", "show", "books", "book", "on", "for", "about"]:
                clean_term = clean_term.replace(stop, "")
            clean_term = clean_term.strip()
            
            if not clean_term:
                db_context = "User requested a book search but specified no keyword."
                fallback_response = {
                    "text": "I would love to help you find books. Could you please specify a subject or keyword? (e.g. 'Find books on Python')",
                    "type": "info"
                }
            else:
                book_query = Book.query.filter(
                    (Book.title.ilike(f'%{clean_term}%')) | 
                    (Book.author.ilike(f'%{clean_term}%')) |
                    (Book.category.ilike(f'%{clean_term}%'))
                )
                if org_id is not None:
                    book_query = book_query.filter(Book.org_id == org_id)
                books = book_query.all()
                if not books:
                    db_context = f"No books matching '{clean_term}' found in inventory."
                    local_type = "error"
                    fallback_response = {
                        "text": f"I scanned our entire inventory but couldn't find any books matching '{clean_term}'. Feel free to try another keyword!",
                        "type": "error"
                    }
                else:
                    db_context = f"Search matches: {len(books)} books found for keyword '{clean_term}'."
                    local_type = "books"
                    local_data = [b.to_dict() for b in books]
                    fallback_response = {
                        "text": f"I found {len(books)} books matching '{clean_term}' in our catalog. Here is a list of results:",
                        "type": "books",
                        "data": local_data
                    }

        # 7. SHOW OVERDUE ACCOUNTS (ADMIN / LIBRARIAN ONLY)
        elif "overdue" in prompt_lower or "late" in prompt_lower:
            if user_role not in ['admin', 'librarian']:
                db_context = "Access denied: Overdue logs are restricted to library staff/admins."
                local_type = "warning"
                fallback_response = {
                    "text": "I'm sorry, details regarding member accounts and overdue notices are restricted to library personnel only.",
                    "type": "warning"
                }
            else:
                overdue_query = Issue.query.filter_by(status='overdue')
                if org_id is not None:
                    overdue_query = overdue_query.filter_by(org_id=org_id)
                overdue_issues = overdue_query.all()
                if not overdue_issues:
                    db_context = "All issued books are up to date. No overdue checkouts."
                    local_type = "success"
                    fallback_response = {
                        "text": "Excellent news! There are currently no overdue books in circulation. All active checkouts are within their dates.",
                        "type": "success"
                    }
                else:
                    db_context = f"Found {len(overdue_issues)} overdue checkouts in system."
                    local_type = "issues"
                    local_data = [i.to_dict() for i in overdue_issues]
                    fallback_response = {
                        "text": f"Here is a summary of the {len(overdue_issues)} active overdue accounts requiring attention:",
                        "type": "issues",
                        "data": local_data
                    }

        # 8. POPULAR BOOKS
        elif "popular" in prompt_lower or "recommend" in prompt_lower or "best" in prompt_lower:
            popular_books = Book.query.order_by(Book.popularity.desc()).limit(3).all()
            db_context = f"Popular trending books: " + ", ".join([b.title for b in popular_books])
            local_type = "books"
            local_data = [b.to_dict() for b in popular_books]
            fallback_response = {
                "text": "Here are the top-trending publications based on reader checkout frequencies and high recommendation indexes:",
                "type": "books",
                "data": local_data
            }

        # 9. ACTIVE CIRCULATION STATS
        elif "issued today" in prompt_lower or "checked out" in prompt_lower or "circulation" in prompt_lower:
            active_count = Issue.query.filter(Issue.status != 'returned').count()
            db_context = f"Current active books checkouts in circulation: {active_count}."
            fallback_response = {
                "text": f"Currently, there are {active_count} books in active circulation. You can check the detailed logs in the Issued Books tab.",
                "type": "info"
            }

        # 10. GREETINGS
        elif any(word in prompt_lower for word in ["hello", "hi", "hey", "greetings", "helper", "who are you"]):
            db_context = "User greeted you. Welcome them and introduce your capabilities."
            fallback_response = {
                "text": "Hello! I am Nova, your AI Knowledge Companion. 📚✨ I can help you search the library catalog, track overdue notices, check your fines, list reservations, or find summaries. Try asking: 'Find books on Software Engineering' or 'What is my fine?' or 'FAQ'!",
                "type": "info"
            }

        # Query LLM
        ai_text = query_llm(prompt, db_context)
        
        if ai_text:
            return {
                "text": ai_text,
                "type": local_type,
                "data": local_data
            }

        # Fallback to local rule-based response engine if LLM keys are absent
        if fallback_response:
            return fallback_response

        # Default fallback
        return {
            "text": "I understand you are asking about '" + prompt + "'. As an AI librarian, I can help you find books, check active holds, look up due dates, or explain summaries. Ask: 'What is my fine?' or 'Show my reservations' or 'FAQ'.",
            "type": "info"
        }
