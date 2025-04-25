"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const errorTypes: Record<string, string> = {
  default: "Kimlik doğrulama sırasında bir hata oluştu.",
  configuration: "Sunucu yapılandırmasında bir sorun var.",
  accessdenied: "Giriş yapma izniniz yok.",
  verification: "Doğrulama bağlantısı geçersiz veya süresi dolmuş.",
  Signin: "Farklı bir hesap veya yöntemle giriş yapmayı deneyin.",
  OAuthSignin: "Farklı bir hesap veya yöntemle giriş yapmayı deneyin.",
  OAuthCallback: "Farklı bir hesap veya yöntemle giriş yapmayı deneyin.",
  OAuthCreateAccount: "Farklı bir hesapla giriş yapmayı deneyin.",
  EmailCreateAccount: "Farklı bir e-posta veya yöntemle giriş yapmayı deneyin.",
  Callback: "Farklı bir hesap veya yöntemle giriş yapmayı deneyin.",
  OAuthAccountNotLinked: "Bu e-posta zaten başka bir hesapla ilişkilendirilmiş.",
  EmailSignin: "E-posta adresinizi kontrol edin.",
  CredentialsSignin: "Girdiğiniz e-posta veya şifre yanlış.",
  DatabaseConnectivity: "Veritabanı bağlantı hatası. Lütfen daha sonra tekrar deneyin.",
};

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>(searchParams?.get("error") || "default");
  const [errorMessage, setErrorMessage] = useState<string>(errorTypes["default"]);

  useEffect(() => {
    // Get the error message that corresponds to the error code
    const code = searchParams?.get("error") || "default";
    setError(code);
    setErrorMessage(errorTypes[code] || errorTypes["default"]);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Kimlik Doğrulama Hatası
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Giriş Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 