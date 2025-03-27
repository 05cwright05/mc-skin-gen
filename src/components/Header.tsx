import { useState } from "react";
import { Burger, Container, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./Header.module.css";
import { User } from "firebase/auth";
import { ProfileButton } from "./ProfileButton";

const links = [
  { link: "about", label: "About" },
  { link: "create", label: "Create" },
  { link: "pricing", label: "Pricing" },
];

interface Props {
  onSelect: (location: string) => void;
  user: User | null;
  signOut: () => Promise<void>;
  signIn: () => Promise<void>;
}

export function Header({ onSelect, user, signOut, signIn }: Props) {
  const [opened, { toggle }] = useDisclosure(false);
  const [active, setActive] = useState(links[0].link);

  const items = links.map((link) => (
    <a
      key={link.label}
      href={link.link}
      className={classes.link}
      data-active={active === link.link || undefined}
      onClick={(event) => {
        event.preventDefault();
        setActive(link.link);
        onSelect(link.link);
      }}
    >
      {link.label}
    </a>
  ));

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <Title className={classes.title}>CubeMe</Title>
        <Group>
          <Group gap={5} visibleFrom="xs">
            {items}
          </Group>
          <ProfileButton
            user={user}
            signOut={signOut}
            signIn={signIn}
          ></ProfileButton>
        </Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
      </Container>
    </header>
  );
}
