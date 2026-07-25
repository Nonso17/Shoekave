import { createContext, useState, useEffect } from "react";
import api from "../api/api";

export const AuthContext = createContext();


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {

        const token = localStorage.getItem("access");

        if (token) {
            getUser();
        } else {
            setLoading(false);
        }

    }, []);



    const getUser = async () => {

        try {

            const response = await api.get("profile/");

            console.log("USER PROFILE:", response.data);
            setUser(response.data);

        } catch (error) {

            console.log(error);

            localStorage.removeItem("access");
            localStorage.removeItem("refresh");

            setUser(null);
        }

        setLoading(false);
    };



const login = async (email, password) => {

    const response = await api.post("login/", {
        email,
        password
    });


    console.log("LOGIN RESPONSE:", response.data);


    localStorage.setItem(
        "access",
        response.data.tokens.access
    );


    localStorage.setItem(
        "refresh",
        response.data.tokens.refresh
    );


    await getUser();

};

    const register = async (data) => {

        const response = await api.post(
            "register/",
            data
        );

        return response.data;
    };



    const logout = () => {

    localStorage.clear();

    setUser(null);

};


    return (

        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                loading
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}