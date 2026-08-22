from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class TreasuryTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["groups"] = list(user.groups.values_list("name", flat=True))
        token["is_admin"] = user.is_superuser
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "groups": list(self.user.groups.values_list("name", flat=True)),
        }
        return data


class LoginView(TokenObtainPairView):
    serializer_class = TreasuryTokenSerializer
