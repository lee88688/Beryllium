import React from 'react';
import { useRouter } from 'next/router'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { apiLogin } from './api/user/login';


export default function Login() {
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: yup.object().shape({
      email: yup.string().email().required(),
      password: yup.string().required()
    }),
    async onSubmit({ email, password }) {
      await apiLogin({ email, password });
      return router.push('/bookshelf');
    }
  });

  return (
    <Container component="main" maxWidth="xs">
      <div className='flex flex-col items-center'>
        {/*<Avatar className={classes.avatar}>*/}
        {/*  <LockOutlinedIcon />*/}
        {/*</Avatar>*/}

        <Typography component="h1" variant="h5">
          用户登陆
        </Typography>
        <form className='w-full mt-2' noValidate>
          <TextField
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.errors.email) && formik.touched.email}
            helperText={formik.touched.email && formik.errors.email}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="email"
            label="电子邮箱"
            autoComplete="email"
            autoFocus
            disabled={formik.isSubmitting}
          />
          <TextField
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(formik.errors.password) && formik.touched.password}
            helperText={formik.touched.password && formik.errors.password}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="密码"
            type="password"
            id="password"
            autoComplete="current-password"
            disabled={formik.isSubmitting}
          />
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            className='mt-2'
            disabled={!formik.isSubmitting}
            onClick={() => formik.handleSubmit()}
          >
            登 陆
          </Button>
        </form>
      </div>
    </Container>
  );
}