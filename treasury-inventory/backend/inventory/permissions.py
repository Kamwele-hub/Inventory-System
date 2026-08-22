from rest_framework.permissions import BasePermission, SAFE_METHODS

ADMIN_GROUPS = {"admin"}
CUSTODIAN_GROUPS = {"custodian", "warehouse_officer", "admin"}


def user_groups(user):
    return set(user.groups.values_list("name", flat=True))


class IsAdminOrReadOnly(BasePermission):
    """Only admins can create/update/delete; everyone authenticated can read.
    Used for reference data (categories, vendors, locations, departments)."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or user_groups(request.user) & ADMIN_GROUPS)
        )


class CanManageInventory(BasePermission):
    """Custodians/warehouse officers/admins can create and update items and
    history records. Auditors get read-only access. Disposal is admin-only,
    enforced in the DisposalRecordViewSet itself."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        groups = user_groups(request.user)
        return request.user.is_superuser or bool(groups & CUSTODIAN_GROUPS)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or user_groups(request.user) & ADMIN_GROUPS)
        )
