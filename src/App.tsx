import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { Footer } from "./components/Footer";
import { Details } from "./components/Details";

export default function App() {
  return (
    <MantineProvider>
      {
        <>
          <Details></Details>
          <Footer></Footer>
        </>
      }
    </MantineProvider>
  );
}
