import classes from "./DescribeSkin.module.css";
import { Container, Paper, Text } from "@mantine/core";

export function DescribeSkin() {
  return (
    <Container size="md" className={classes.container}>
      <Paper shadow="xs" p="xl" radius="md" className={classes.paper}>
        <Text>Paper is the most basic ui component</Text>
        <Text>
          Use it to create cards, dropdowns, modals and other components that
          require background with shadow
        </Text>
      </Paper>
    </Container>
  );
}
