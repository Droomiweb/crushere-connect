import { useEffect } from "react";

interface PhoneEmailLoginProps {
  onSuccess: (userDetails: any) => void;
}

const PhoneEmailLogin = ({ onSuccess }: PhoneEmailLoginProps) => {
  useEffect(() => {
    // Define the listener function globally
    // @ts-ignore
    window.phoneEmailListener = (userObj: any) => {
      console.log("Phone verification success:", userObj);
      onSuccess(userObj);
    };

    // Load the script
    const script = document.createElement("script");
    script.src = "https://www.phone.email/sign_in_button_v1.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      // @ts-ignore
      delete window.phoneEmailListener;
    };
  }, [onSuccess]);

  return (
    <div className="flex justify-center p-4">
      <div 
        className="pe_signin_button" 
        data-client-id={import.meta.env.VITE_PHONE_EMAIL_CLIENT_ID}
      >
      </div>
    </div>
  );
};

export default PhoneEmailLogin;
