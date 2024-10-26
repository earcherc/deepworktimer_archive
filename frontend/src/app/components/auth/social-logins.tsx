'use client';

import { handleGoogleLogin, loadGoogleSignInAPI } from './utils';
import useToast from '@context/toasts/toast-context';
import { AuthenticationService } from '@api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const SocialLogins = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    loadGoogleSignInAPI()
      .then(() => {
        console.log('Google API loaded successfully');
      })
      .catch((error) => {
        console.error('Failed to load Google API:', error);
      });
  }, []);

  const handleGoogleLoginClick = async () => {
    setIsLoading(true);
    try {
      const accessToken = await handleGoogleLogin();
      const response = await AuthenticationService.googleLoginAuthGoogleLoginPost(accessToken);
      if (response) {
        router.push('/home');
      } else {
        throw new Error('Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      addToast({ type: 'error', content: 'Failed to login with Google' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleGoogleLoginClick}
        disabled={isLoading}
        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
      >
        <span className="sr-only">Sign in with Google</span>
        <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
        Sign in with Google
      </button>
    </div>
  );
};

export default SocialLogins;
