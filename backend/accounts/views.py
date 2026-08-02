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
from .emails import send_brevo_email, send_welcome_email
import logging

logger = logging.getLogger(__name__)


class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            tokens = serializer.get_tokens(user)

            # Send Welcome Email via Brevo
            try:
                send_welcome_email(user)
            except Exception as exc:
                logger.error(f"Failed to send welcome email to {user.email}: {exc}")

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


import random
import random
import requests



class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required."}, status=400)
        
        from .models import User
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return the same message whether or not the email exists (prevents user enumeration)
            return Response({
                "message": "If this email is registered, a reset code has been sent."
            }, status=200)

        code = "".join(random.choices("0123456789", k=6))
        user.reset_code = code
        user.save()

        # Try SMTP first; if it fails, fall back to Brevo HTTP API
        smtp_error = None
        try:
            send_mail(
                subject="ShoeKave — Your Password Reset Code",
                message=(
                    f"Hi {user.first_name or 'there'},\n\n"
                    f"Your password reset code is: {code}\n\n"
                    f"This code will expire once used. If you did not request this, please ignore this email.\n\n"
                    f"— ShoeKave Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as exc:
            smtp_error = str(exc)

        if smtp_error:
            # Attempt Brevo HTTP API fallback
            try:
                send_brevo_email(
                    subject="ShoeKave — Your Password Reset Code",
                    text_content=(
                        f"Hi {user.first_name or 'there'},\n\n"
                        f"Your password reset code is: {code}\n\n"
                        f"This code will expire once used. If you did not request this, please ignore this email.\n\n"
                        f"— ShoeKave Team"
                    ),
                    recipient_email=user.email,
                )
            except Exception as exc:
                # Both SMTP and Brevo failed; return combined error info for debugging
                return Response(
                    {"error": "Unable to send reset email right now. SMTP error: %s; Brevo error: %s" % (smtp_error, str(exc))},
                    status=500,
                )

        return Response({
            "message": "If this email is registered, a reset code has been sent."
        }, status=200)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        new_password = request.data.get("new_password")

        if not email or not code or not new_password:
            return Response({"error": "Email, code, and new password are required."}, status=400)

        from .models import User
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid request details."}, status=400)

        if not user.reset_code or user.reset_code != code:
            return Response({"error": "Invalid or expired reset code."}, status=400)

        user.set_password(new_password)
        user.reset_code = None
        user.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Password has been reset successfully.",
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



