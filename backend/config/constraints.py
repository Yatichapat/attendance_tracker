"""
Application constants and configuration values.
"""

# User roles
class UserRoles:
    STUDENT = "student"
    EMPLOYEE = "employee"

    CHOICES = [
        (STUDENT, "Student"),
        (EMPLOYEE, "Employee")
    ]

# Validation limits
class ValidationLimits:
    """Validation limits for activities."""
    CATEGORIES_MIN = 1
    CATEGORIES_MAX = 3
    MAX_TITLE_LENGTH = 255
    MAX_ORGANIZATION_NAME_LENGTH = 255
    MAX_USER_NAME_LENGTH = 100
    MAX_USER_TITLE_LENGTH = 20
    MAX_STUDENT_ID_LENGTH = 50
    MAX_LOCATION_LENGTH = 255
