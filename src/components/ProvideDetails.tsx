import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Group, Text, Center } from "@mantine/core";
import classes from "./ProvideDetails.module.css";
import { FloatingLabelInput } from "./FloatingLabelInput";
import { useState } from "react";

interface Props {
  open: boolean;
  setOpen: (setter: boolean) => void;
}
export function ProvideDetails({ open, setOpen }: Props) {
  const [shirt, setShirt] = useState("");
  const [pants, setPants] = useState("");
  const [accessories, setAccessories] = useState("");
  const isButtonEnabled = shirt.trim() !== "" && pants.trim() !== "";

  return (
    <>
      <Modal
        centered
        opened={open}
        onClose={() => setOpen(false)}
        title="Add Additional Details"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        className={classes.container}
      >
        <FloatingLabelInput
          placeholder="A red sweatshirt"
          label="Shirt"
          setItem={setShirt}
        ></FloatingLabelInput>
        <FloatingLabelInput
          placeholder="jeans"
          label="Pants:"
          setItem={setPants}
        ></FloatingLabelInput>
        <FloatingLabelInput
          placeholder="black sunglasses"
          label="Accessories:"
          setItem={setAccessories}
          required={false}
        ></FloatingLabelInput>
        <Center>
          <Button mt="md" disabled={!isButtonEnabled}>
            Click me
          </Button>
        </Center>
      </Modal>
    </>
  );
}
