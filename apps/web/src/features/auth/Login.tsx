import { authHelpers } from "@budget/api";

const LoginComponent = () => {
  const handleSignIn = async () => {
    try {
      await authHelpers.signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed: ", error);
    }
  };

  return <button onClick={handleSignIn}>Sign In With Google</button>;
};

export default LoginComponent;
