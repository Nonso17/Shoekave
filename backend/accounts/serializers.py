from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
import re
from django.contrib.auth import authenticate

from .models import User


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)


    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "email",
            "password",
        )


    def validate_email(self, value):

        value = value.lower()

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value



    def validate_password(self, value):

        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )


        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter."
            )


        if not re.search(r"[a-z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one lowercase letter."
            )


        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "Password must contain at least one number."
            )


        return value



    def create(self, validated_data):

        password = validated_data.pop("password")

        user = User(**validated_data)

        user.set_password(password)

        user.save()

        return user



    def get_tokens(self, user):

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }





class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(write_only=True)



    def validate(self, attrs):

        email = attrs.get("email")

        password = attrs.get("password")


        user = authenticate(
            username=email,
            password=password
        )


        if not user:

            raise serializers.ValidationError(
                "Invalid email or password."
            )


        attrs["user"] = user

        return attrs





class ProfileSerializer(serializers.ModelSerializer):

    class Meta:

        model = User

        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
        )