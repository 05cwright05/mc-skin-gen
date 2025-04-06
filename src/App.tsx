import "@mantine/core/styles.css";

import { createTheme, MantineProvider } from "@mantine/core";
import { Footer } from "./components/Footer";
import { Details } from "./components/Details";
import { Header } from "./components/Header";
import { DropzoneButton } from "./components/DropzoneButton";
import { DescribeSkin } from "./components/DescribeSkin";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase-config.ts";
import { useEffect, useState } from "react";
import { ProvideDetails } from "./components/ProvideDetails.tsx";

const theme = createTheme({
  colors: {
    // Add your color
    deepBlue: [
      "#eef3ff",
      "#dce4f5",
      "#b9c7e2",
      "#94a8d0",
      "#748dc1",
      "#5f7cb8",
      "#5474b4",
      "#44639f",
      "#39588f",
      "#2d4b81",
    ],
    // or replace default theme color
    // blue: [
    //   "#eef3ff",
    //   "#dee2f2",
    //   "#bdc2de",
    //   "#98a0ca",
    //   "#7a84ba",
    //   "#6672b0",
    //   "#5c68ac",
    //   "#4c5897",
    //   "#424e88",
    //   "#364379",
    // ],
  },
});
export default function App() {
  const [modalOpened, setModalOpened] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null); // State to store the dropped file

  useEffect(() => {
    // Firebase listener for authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Update state when user logs in or out
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const handleScroll = (targetSection: string) => {
    if (targetSection === "about") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document
        .getElementById(targetSection)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("User signed in:", user.displayName);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.log(err);
    }
  };
  console.log(auth?.currentUser?.uid);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {
        <>
          <Header
            onSelect={handleScroll}
            user={user}
            signOut={handleLogout}
            signIn={handleSignIn}
          ></Header>
          <div id="about">
            <Details
              signIn={handleSignIn}
              user={user}
              scrollDown={handleScroll}
            ></Details>
          </div>
          <div id="create">
            <DropzoneButton
              signIn={handleSignIn}
              user={user}
              openModal={setModalOpened}
              setFile={setFile}
            ></DropzoneButton>
          </div>
          <div id="pricing"> </div>
          <DescribeSkin></DescribeSkin>
          <ProvideDetails
            open={modalOpened}
            setOpen={setModalOpened}
            file={file}
            setFile={setFile}
          ></ProvideDetails>
          <Footer></Footer>
        </>
      }
    </MantineProvider>
  );
}
