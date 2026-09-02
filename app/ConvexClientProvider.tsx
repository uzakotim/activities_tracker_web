"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { GoogleOAuthProvider, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { api } from "@/convex/_generated/api";
import { UserProfile } from "@/lib/types";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://abundant-poodle-486.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

interface GoogleJwtPayload {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: (credentialResponse: CredentialResponse) => Promise<void>;
  logout: () => void;
  loginAsDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginWithGoogle: async () => { },
  logout: () => { },
  loginAsDemoUser: () => { },
});

export const useAuth = () => useContext(AuthContext);

function AuthStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const storeUserMutation = useMutation(api.users.storeUser);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("activity_tracker_user");
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        setUser(parsed);
        // Refresh last seen
        storeUserMutation({
          tokenIdentifier: parsed.tokenIdentifier,
          email: parsed.email,
          name: parsed.name,
          pictureUrl: parsed.pictureUrl,
        }).catch(() => { });
      }
    } catch (e) {
      console.error("Failed to load user from localStorage", e);
    } finally {
      setIsLoading(false);
    }
  }, [storeUserMutation]);

  const loginWithGoogle = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential returned from Google login");
      }

      const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
      const userProfile: UserProfile = {
        id: decoded.sub,
        tokenIdentifier: `google:${decoded.sub}`,
        name: decoded.name || "Google User",
        email: decoded.email || "",
        pictureUrl: decoded.picture,
      };

      setUser(userProfile);
      localStorage.setItem("activity_tracker_user", JSON.stringify(userProfile));

      // Persist in Convex
      await storeUserMutation({
        tokenIdentifier: userProfile.tokenIdentifier,
        email: userProfile.email,
        name: userProfile.name,
        pictureUrl: userProfile.pictureUrl,
      });
    } catch (error) {
      console.error("Google login failed", error);
      throw error;
    }
  };

  const loginAsDemoUser = () => {
    const demoProfile: UserProfile = {
      id: "demo-user-123",
      tokenIdentifier: "google:demo-user-123",
      name: "John Doe",
      email: "johndoe@example.com",
      pictureUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };
    setUser(demoProfile);
    localStorage.setItem("activity_tracker_user", JSON.stringify(demoProfile));
    storeUserMutation({
      tokenIdentifier: demoProfile.tokenIdentifier,
      email: demoProfile.email,
      name: demoProfile.name,
      pictureUrl: demoProfile.pictureUrl,
    }).catch(() => { });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("activity_tracker_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithGoogle,
        logout,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "44523604985-a3d6dk2gb35133tvta9n4p9eg3iq4tjq.apps.googleusercontent.com";

  return (
    <ConvexProvider client={convex}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthStateProvider>{children}</AuthStateProvider>
      </GoogleOAuthProvider>
    </ConvexProvider>
  );
}
