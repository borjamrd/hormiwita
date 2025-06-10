"use client";

import Link from "next/link";
import Image from "next/image";
import useUserStore from "@/store/userStore";
import { UserCircle } from "lucide-react";

export const NavBar = () => {
  const userData = useUserStore((state) => state.userData);

  return (
    <nav className="bg-card shadow-md w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="flex items-center cursor-pointer">
            <Image
              src="/hormiguita_logo.png"
              alt="hormiwita logo"
              width={40}
              height={40}
              className="mr-2"
            />
            <span className="text-xl font-semibold text-gray-800">
              hormiw<span className="text-primary uppercase">i</span>t
              <span className="text-primary uppercase">a</span>
            </span>
          </div>
        </Link>
        {userData && (
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <div className="flex items-center text-sm text-foreground">
              <UserCircle className="h-5 w-5 mr-1 text-primary" />
              <span>{userData.name || "Usuario"}</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
