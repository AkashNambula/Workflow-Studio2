class ConditionNode:

    def execute(
        self,
        employee_name,
        employee_email,
        employee_phone,
        employee_role,
        joining_date
    ):

        # Name validation
        if not employee_name or len(employee_name.strip()) < 3:
            return False

        # Email validation
        if not employee_email:
            return False

        if "@" not in employee_email:
            return False

        if "." not in employee_email:
            return False

        # Phone validation
        if not employee_phone:
            return False

        if not employee_phone.isdigit():
            return False

        if len(employee_phone) != 10:
            return False

        # Role validation
        if not employee_role:
            return False

        # Joining date validation
        if not joining_date:
            return False

        return True