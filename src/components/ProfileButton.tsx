import { Menu, Button } from "@mantine/core";
import { IconLogout2, IconUser, IconBrandGoogle } from "@tabler/icons-react";
import { User } from "firebase/auth";

interface Props {
  user: User | null;
  signOut: () => Promise<void>;
  signIn: () => Promise<void>;
}
export function ProfileButton({ user, signOut, signIn }: Props) {
  return (
    <Menu shadow="md" width={200} zIndex={9999}>
      <Menu.Target>
        <Button>{user ? user.displayName : "Sign in"}</Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Options</Menu.Label>
        {user ? (
          <>
            <Menu.Item leftSection={<IconUser size={14} />}>Profile</Menu.Item>
            <Menu.Item
              onClick={signOut}
              leftSection={<IconLogout2 size={14} />}
            >
              Sign out
            </Menu.Item>
          </>
        ) : (
          <Menu.Item
            onClick={signIn}
            leftSection={<IconBrandGoogle size={14} />}
          >
            Sign in with Google
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
