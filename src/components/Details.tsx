import { IconCheck } from "@tabler/icons-react";
import {
  Button,
  Container,
  Group,
  Image,
  List,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import classes from "./Details.module.css";
import steve_img from "../assets/steve.png";

export function Details() {
  return (
    <Container size="md">
      <div className={classes.inner}>
        <div className={classes.content}>
          <Title className={classes.title}>
            Create <span className={classes.highlight}>your</span> <br />{" "}
            Minecraft skin
          </Title>
          <Text c="dimmed" mt="md">
            Transform your profile picture into a custom Minecraft
            skin—instantly and effortlessly! Upload a photo of yourself, and our
            tool will generate a unique Minecraft skin that captures your look
            in blocky, pixel-perfect style.{" "}
          </Text>

          <List
            mt={30}
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon size={20} radius="xl">
                <IconCheck size={12} stroke={1.5} />
              </ThemeIcon>
            }
          >
            <List.Item>
              <b>Privacy First</b> – your image is not sent to any third party
              services
            </List.Item>
            <List.Item>
              <b>Free to use</b> – Generate your first minecraft avatar for free
            </List.Item>
            <List.Item>
              <b>Instant Download</b> – Get your Minecraft skin in seconds,
              ready to upload and play
            </List.Item>
          </List>
        </div>
        <Image src={steve_img} className={classes.image} />
      </div>
    </Container>
  );
}
