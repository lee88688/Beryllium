import Brightness7 from "@mui/icons-material/Brightness7";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import Brightness4 from "@mui/icons-material/Brightness4";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import React from "react";
import { useAtom } from "jotai";
import { themeModeAtom } from "y/store/theme";
import { ThemeMode } from "y/utils/constants";

const options = [
  { node: <SettingsBrightnessIcon key="system" />, mode: ThemeMode.Auto },
  { node: <Brightness4 key="dark" />, mode: ThemeMode.Dark },
  { node: <Brightness7 key="light" />, mode: ThemeMode.Light },
];

export function ThemeModeIconButton(props: {
  className?: string;
  edge?: "start" | "end";
}) {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const icon = options.find((item) => item.mode === themeMode)?.node;

  return (
    <>
      <IconButton
        color="inherit"
        edge={props.edge}
        className={props.className}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        {icon}
      </IconButton>
      <Menu
        id="lock-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "lock-button",
          role: "listbox",
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.mode}
            disabled={option.mode === themeMode}
            selected={option.mode === themeMode}
            onClick={() => setThemeMode(option.mode)}
          >
            {option.node}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
