from rest_framework.pagination import CursorPagination


class ItemCursorPagination(CursorPagination):
    """
    Cursor-based pagination avoids the expensive COUNT(*) and OFFSET scan
    that page-number pagination performs on large, frequently-written
    tables -- the asset register only grows over time. `created_at` is
    indexed (see Item.Meta.indexes) so this stays fast at scale.
    """
    page_size = 25
    max_page_size = 200
    page_size_query_param = "page_size"
    ordering = "-created_at"


class CustodyRecordCursorPagination(CursorPagination):
    page_size = 25
    max_page_size = 200
    page_size_query_param = "page_size"
    ordering = "-received_at"


class ServiceRecordCursorPagination(CursorPagination):
    page_size = 25
    max_page_size = 200
    page_size_query_param = "page_size"
    ordering = "-service_date"
