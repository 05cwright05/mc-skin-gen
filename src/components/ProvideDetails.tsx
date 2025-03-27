import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Group, Text } from "@mantine/core";
import classes from "./ProvideDetails.module.css";
export function ProvideDetails() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="Authentication"
        overlayProps={{
          backgroundOpacity: 0.8,
          blur: 3,
        }}
        className={classes.container}
      ></Modal>

      <Button variant="default" onClick={open}>
        Open modal
      </Button>
    </>
  );
}
