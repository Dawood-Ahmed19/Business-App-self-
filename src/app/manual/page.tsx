"use client";

import Link from "next/link";

const paragraphs = [
    ` This application is an admin dashboard designed to help you manage
                    your business data in one place. Access to the system is restricted
                    to registered users, and actions are controlled by user roles to keep
                    your information secure. All data is stored in a centralized MongoDB
                    database, and changes you make in the dashboard are saved and updated
                    in real time.`,
    `To begin, new users sign up with their email address and password.
                    After registration, a verification step may be required before they
                    can log in. Existing users can log in through the Admin Login page
                    using their email and password. Credentials are checked securely on
                    the server, and if they are valid a secure session token is created
                    and stored as an HTTP-only cookie. This token is used to keep you
                    logged in while you navigate different pages without having to enter
                    your password again.`,
    `Once logged in, admins can view and manage the key entities of the
                    system (such as users, products, orders, or other records depending
                    on your configuration). Typical actions include creating new entries,
                    editing existing records, and deactivating or deleting items that are
                    no longer needed. Every operation you perform in the interface sends
                    a request to the server, where it is validated and then written to
                    the database. Only authorized roles are allowed to perform sensitive
                    changes, which helps protect important settings and business data.`,
    `The dashboard is designed to give you an at-a-glance overview of your
                    system. You may see summary statistics, recent activity, and quick
                    links to the most important sections. From there, you can drill down
                    into detailed views for more specific information. The interface aims
                    to be simple and consistent, so actions like adding, editing, and
                    saving follow the same pattern throughout the app.`,
    `If you encounter issues signing in, first check that your email is
                    verified and that your credentials are correct. If problems persist,
                    try logging out and back in, or contact an administrator with higher
                    access to review your account. Because all actions are processed
                    through the backend, you can be confident that data is validated and
                    stored safely each time you use the application.`,
];

export default function Manual() {
    return (
        <main className="min-h-screen bg-[#0b0d17] text-white flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl bg-[#151827] rounded-xl p-8 shadow-xl space-y-6">
                <h1 className="text-3xl font-bold">About This Application</h1>

                {paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-gray-300 leading-relaxed text-sm">
                        {paragraph}
                    </p>
                ))}

                <div>
                    <Link
                        href="/"
                        className="text-blue-400 hover:text-blue-300 underline"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
