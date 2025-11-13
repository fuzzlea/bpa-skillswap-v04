import { useState } from 'react';
import { getToken, logout } from '../services/auth';

interface HamburgerMenuProps {
    onNavigate: (route: string) => void;
    userAdmin: boolean;
}

export default function HamburgerMenu({ onNavigate, userAdmin }: HamburgerMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleNavClick = (route: string) => {
        onNavigate(route);
        setIsOpen(false);
    };

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        onNavigate('login');
    };

    if (!getToken()) {
        return null;
    }

    return (
        <div className="relative">
            {/* Hamburger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label="Toggle menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                    <button
                        onClick={() => handleNavClick('myprofile')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                        My Profile
                    </button>
                    <button
                        onClick={() => handleNavClick('mysessions')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                        My Sessions
                    </button>
                    <button
                        onClick={() => handleNavClick('sessions')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                        Browse Sessions
                    </button>
                    <button
                        onClick={() => handleNavClick('ratings')}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                        Ratings
                    </button>
                    {userAdmin && (
                        <button
                            onClick={() => handleNavClick('admin')}
                            className="block w-full text-left px-4 py-2 text-purple-600 font-bold hover:bg-gray-100 border-t"
                        >
                            Admin Panel
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 border-t"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
