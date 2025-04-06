import { Modal, Button, Text, Center, Loader, Select } from "@mantine/core";
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
  setFile: (file: File | null) => void;
}
export function ProvideDetails({ open, setOpen, file, setFile }: Props) {
  // collect, Processing Information, Processing Complete
  const [currentContent, setCurrentContent] = useState(
    "Additional Information"
  );
  const [result, setResult] = useState("");
  const [shirt, setShirt] = useState("");
  const [pants, setPants] = useState("");
  const [accessories, setAccessories] = useState("");
  const [gender, setGender] = useState<string | null>("");
  const isButtonEnabled =
    shirt.trim() !== "" && pants.trim() !== "" && gender?.trim() !== "";
  const handleUploadImage = async (
    base64Image: string,
    fileName: string
  ): Promise<string> => {
    const uploadImageFunction = httpsCallable<
      {
        img: string;
        fileName: string;
        shirt: string;
        pants: string;
        accesories?: string;
        gender: string | null;
      },
      string
    >(functions, "upload_image");

    try {
      const response = await uploadImageFunction({
        img: base64Image,
        fileName: fileName,
        shirt,
        pants,
        accesories: accessories, // optional
        gender: gender,
      });

      console.log("Image uploaded successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Function to convert a .png image file to a base64 string
  const convertToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          // Extract the base64 part (after the comma)
          const base64WithPrefix = reader.result;
          const base64Raw = base64WithPrefix.split(",")[1] ?? "";

          // Fix padding
          const padded =
            base64Raw + "=".repeat((4 - (base64Raw.length % 4)) % 4);

          resolve(padded);
        } else {
          reject(new Error("FileReader result is not a string."));
        }
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
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
    console.log(b64Image);
    // Add null check
    if (!b64Image || typeof b64Image !== "string") {
      console.error("Failed to convert image to base64");
      return;
    }
    if (auth.currentUser) {
      const imageString = await handleUploadImage(b64Image, file.name);
      console.log(imageString, "success");
      setResult(imageString);
      setCurrentContent("Processing Complete");
      console.log("all processing done");
    } else {
      console.log("NO AUTHORIZED USER");
    }
    setGender("");
    setAccessories("");
    setShirt("");
    setPants("");
    setFile(null);
  };

  return (
    <Modal
      centered
      opened={open}
      onClose={() => {
        setOpen(false);
        setCurrentContent("Additional Information");
      }}
      title={currentContent}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      closeOnClickOutside={false}
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
          <Select
            mt="md"
            comboboxProps={{ withinPortal: true }}
            data={["Male", "Female"]}
            placeholder="Pick one"
            label="Masculine or Feminine Avatar?"
            classNames={classes}
            onChange={(value) => setGender(value)}
            required={true}
          />
          <Center>
            <Button mt="md" disabled={!isButtonEnabled} onClick={handleSubmit}>
              Submit
            </Button>
          </Center>
        </>
      )}

      {currentContent === "Processing Information" && (
        <Center style={{ height: 100 }}>
          <Loader size="lg" />
        </Center>
      )}
      {currentContent === "Processing Complete" && result === "success" && (
        <Center style={{ flexDirection: "column", height: 100 }}>
          <Text size="lg">
            Due to limited resources, we process skins in batches, please keep
            an eye on the email associated with your account and expect the skin
            in the next 5 minutes. If you don't see the skin check junk mail or
            reach out to cubemeteam@gmail.com
          </Text>
        </Center>
      )}
      {currentContent === "Processing Complete" &&
        result === "already processing" && (
          <Center style={{ flexDirection: "column", height: 100 }}>
            <Text size="md">
              We are currently processing your request. If you do not receive
              your skin via email in the next hour please reach out to
              cubmeteam@gmail.com
            </Text>
          </Center>
        )}

      {currentContent === "Processing Complete" && result === "token" && (
        <Center style={{ flexDirection: "column", height: 100 }}>
          <Text size="md">
            You are out of image generation tokens, the ability to purchase more
            tokens will be released next week
          </Text>
        </Center>
      )}
      {currentContent === "Processing Complete" && result === "not found" && (
        <Center style={{ flexDirection: "column", height: 100 }}>
          <Text size="md">
            Account not set up properly, please contact cubemeteam@gmail.com
          </Text>
        </Center>
      )}
      {currentContent === "Processing Complete" &&
        result === "unauthenticated" && (
          <Center style={{ flexDirection: "column", height: 100 }}>
            <Text size="md">
              Account failed to authenticate. Please sign out and sign back in.
              If that does not fix the issue, contact cubemeteam@gmail.com
            </Text>
          </Center>
        )}
    </Modal>
  );
}
