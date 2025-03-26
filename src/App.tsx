import "@mantine/core/styles.css";

import { createTheme, MantineProvider } from "@mantine/core";
import { Footer } from "./components/Footer";
import { Details } from "./components/Details";
import { Header } from "./components/Header";
import { DropzoneButton } from "./components/DropzoneButton";
import { DescribeSkin } from "./components/DescribeSkin";

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
  const handleScroll = (targetSection: string) => {
    if (targetSection === "about") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document
        .getElementById(targetSection)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {
        <>
          <Header onSelect={handleScroll}></Header>
          <div id="about">
            <Details></Details>
          </div>
          <div id="create">
            <DropzoneButton></DropzoneButton>
          </div>
          <div id="pricing"> </div>
          <DescribeSkin></DescribeSkin>
          <Footer></Footer>
        </>
      }
    </MantineProvider>
  );
}
