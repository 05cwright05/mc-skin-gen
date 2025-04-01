import { Modal, Button, Group, Text, Center, Loader } from "@mantine/core";
import classes from "./ProvideDetails.module.css";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase-config.ts";
import { getAuth } from "firebase/auth";

const auth = getAuth();
interface Props {
  open: boolean;
  setOpen: (setter: boolean) => void;
  file: File | null;
}
export function ProvideDetails({ open, setOpen, file }: Props) {
  // collect, Processing Information, Processing Complete
  const [currentContent, setCurrentContent] = useState(
    "Additional Information"
  );
  const [result, setResult] = useState("");
  const [shirt, setShirt] = useState("");
  const [pants, setPants] = useState("");
  const [accessories, setAccessories] = useState("");
  const isButtonEnabled = shirt.trim() !== "" && pants.trim() !== "";
  const handleUploadImage = async (
    base64Image: string,
    fileName: string
  ): Promise<string> => {
    const uploadImageFunction = httpsCallable<{
      base64String: string;
      fileName: string;
    }>(functions, "upload_image");

    try {
      const response = await uploadImageFunction({
        base64String: base64Image,
        fileName: fileName,
      });
      console.log("Image uploaded successfully:", response.data);

      // Assuming response.data contains a string you want to return
      return response.data as string;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Function to convert a .png image file to a base64 string
  const convertToBase64 = (file: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file); // Converts the file to base64
    });
  };

  const handleSubmit = async () => {
    //def set something true that pops up like a loading icon
    console.log("submitting this image ;)");
    //RUN TEST FUNCTION
    console.log("testing");

    console.log("done running test");
    if (!file) {
      console.error("No file selected");
      return; // Exit if no file is selected
    }
    // Add before handleSubmit
    if (file && !file.name.match(/\.(png|jpg|jpeg)$/i)) {
      console.error("Invalid file type");
      return;
    }

    setCurrentContent("Processing Information");
    const b64Image = await convertToBase64(file);
    // Add null check
    if (!b64Image || typeof b64Image !== "string") {
      console.error("Failed to convert image to base64");
      return;
    }
    console.log("USER:", auth.currentUser?.displayName);
    if (auth.currentUser) {
      const imageString = await handleUploadImage(
        b64Image as string,
        file.name
      );
      console.log(imageString, "success");
      setResult(imageString);
      setCurrentContent("Processing Complete");
      console.log("all processing done");
    } else {
      console.log("NO AUTHORIZED USER");
    }
  };

  return (
    <Modal
      centered
      opened={open}
      onClose={() => setOpen(false)}
      title={currentContent}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      className={classes.container}
    >
      {currentContent === "Additional Information" && (
        <>
          <FloatingLabelInput
            placeholder="A red sweatshirt"
            label="Shirt"
            setItem={setShirt}
          />
          <FloatingLabelInput
            placeholder="jeans"
            label="Pants:"
            setItem={setPants}
          />
          <FloatingLabelInput
            placeholder="black sunglasses"
            label="Accessories:"
            setItem={setAccessories}
            required={false}
          />
          <Center>
            <Button mt="md" disabled={!isButtonEnabled} onClick={handleSubmit}>
              Click me
            </Button>
          </Center>
        </>
      )}

      {currentContent === "Processing Information" && (
        <Center style={{ height: 100 }}>
          <Loader size="lg" />
        </Center>
      )}

      {currentContent === "Processing Complete" && (
        <Center style={{ flexDirection: "column", height: 100 }}>
          <Text size="lg">Result: {result}</Text>
          <Button
            mt="md"
            onClick={() => setCurrentContent("Additional Information")}
          >
            Reset
          </Button>
        </Center>
      )}
    </Modal>
  );
}
