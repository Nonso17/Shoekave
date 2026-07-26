from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import login
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate

from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    UserManagementSerializer,
)

class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            tokens = serializer.get_tokens(user)

            return Response(
                {
                    "message": "Account created successfully.",
                    "user": {
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email,
                        "is_staff": user.is_staff,
                    },
                    "tokens": tokens,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
    

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login successful.",
                    "user": {
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email,
                        "is_staff": user.is_staff,
                    },
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)

        return Response(serializer.data)


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from .models import User
        users = User.objects.all().order_by("-date_joined")
        serializer = UserManagementSerializer(users, many=True)
        return Response(serializer.data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        from .models import User
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        serializer = UserManagementSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        from .models import User
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        if user == request.user:
            return Response({"error": "You cannot delete your own account."}, status=400)

        user.delete()
        return Response({"message": "User deleted successfully."})

class AdminLoginView(APIView):
    
    permission_classes = [AllowAny]


    def post(self, request):

        email = request.data.get("email")
        password = request.data.get("password")


        user = authenticate(
            username=email,
            password=password
        )


        if user is None:
            return Response(
                {
                    "error": "Invalid credentials"
                },
                status=400
            )


        if not user.is_staff:
            return Response(
                {
                    "error": "Not an admin account"
                },
                status=403
            )


        refresh = RefreshToken.for_user(user)


        return Response(
            {
                "message": "Admin login successful",

                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },

                "admin": {
                    "email": user.email,
                    "name": user.first_name
                }
            }
        )


