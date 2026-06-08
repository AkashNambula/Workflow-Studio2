class ConditionNode:

    def execute(
        self,
        employee_name,
        employee_email,
        employee_phone,
        employee_role,
        joining_date
    ):

        if not employee_name:
            return False

        if not employee_email:
            return False

        if "@" not in employee_email:
            return False

        if not employee_phone:
            return False

        if len(employee_phone) != 10:
            return False

        if not employee_role:
            return False

        if not joining_date:
            return False

        return True