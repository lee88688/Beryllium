import React, { useState } from "react";
import { AutoDrawer } from "y/components/drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemIcon from "@mui/material/ListItemIcon";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import DeleteIcon from "@mui/icons-material/Delete";
import Container from "@mui/material/Container";
import ArrowBack from "@mui/icons-material/ArrowBack";
import LoadingButton from "@mui/lab/LoadingButton";
import { makeStyles } from "y/utils/makesStyles";
import { useRouter } from "next/router";
import Divider from "@mui/material/Divider";
import { useMutation } from "@tanstack/react-query";
import { apiChangePassword } from "./clientApi";
import { type GetServerSideProps } from "next";
import { prisma } from "y/server/db";
import { withSessionSsr } from "y/config";

const useStyles = makeStyles()((theme) => ({
  root: {},
  appBarTitle: {
    flexGrow: 1,
  },
  card: {
    marginTop: theme.spacing(2),
  },
}));

type SettingProps = {
  isAdmin: boolean;
};

export default function Setting(props: SettingProps) {
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");

  const router = useRouter();

  const goBack = () => {
    return router.push("/bookshelf");
  };

  const { classes } = useStyles();

  const passwordMutation = useMutation({
    mutationFn: () => apiChangePassword({ password }),
  });

  return (
    <>
      <Box className={classes.root}>
        <AppBar component={"nav"}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={goBack}
            >
              <ArrowBack />
            </IconButton>
            <Typography className={classes.appBarTitle} variant="h6" noWrap>
              Setting
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="sm">
          <Toolbar />
          <Card className={classes.card}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Modify Password
              </Typography>
              <Box sx={{ mb: 1 }}>
                <TextField
                  label="new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Box>
              <div>
                <TextField
                  label="input again"
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardActions>
              {/* <Button>confirm</Button> */}
              <LoadingButton
                loading={passwordMutation.isLoading}
                loadingIndicator="Loading…"
                onClick={() => {
                  void passwordMutation.mutateAsync().then(() => {
                    setPassword("");
                    setRePassword("");
                  });
                }}
              >
                confirm
              </LoadingButton>
            </CardActions>
          </Card>

          {props.isAdmin && (
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Numbers
                </Typography>
                <List
                  subheader={
                    <ListSubheader disableGutters>Add New User</ListSubheader>
                  }
                >
                  <ListItem disableGutters>
                    <TextField label="User Name" />
                  </ListItem>
                  <ListItem disableGutters>
                    <TextField label="Password" />
                  </ListItem>
                  <ListItem disableGutters>
                    <Button>Add</Button>
                  </ListItem>
                </List>
                <Divider />
                <List
                  subheader={
                    <ListSubheader disableGutters>User List</ListSubheader>
                  }
                >
                  <ListItem
                    disableGutters
                    secondaryAction={
                      <IconButton edge="end">
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText>Name</ListItemText>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<SettingProps> =
  withSessionSsr(async ({ req }) => {
    const userId = req.session.user.id;
    const user = await prisma.user.findFirst({ where: { id: userId } });

    return {
      props: { isAdmin: Boolean(user?.isAdmin) },
    };
  });
