// components/Footer.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <footer className="bg-black text-white px-6 py-12 border-t border-white" role="contentinfo">
            <h1 className="text-yellow-400 text-center mt-2 text-xl font-semibold">
                {t("An Application to ensure the best care for our furry friends!")}
            </h1>

            <div className="max-w-6xl mx-auto mt-10">
                {/* Force 4 columns */}
                <div className="grid grid-cols-4 gap-8">
                    {/* About Us */}
                    <div>
                        <h2 className="text-lg font-bold mb-6">{t("About Us")}</h2>
                        <ul className="space-y-3">
                            <li>{t("We Like Cats,We Like AI, So we are making an AI application for cats.")}</li>
                        </ul>
                        {/* Learn More Button */}
                        <button
                            onClick={() => navigate("/About")}
                            className="mt-4 px-4 py-2 bg-yellow-300 text-black font-semibold rounded hover:bg-green-600 transition"
                        >
                            {t("Learn More About Us")}
                        </button>
                    </div>

                    {/* Services */}
                    <div>
                        <h2 className="text-lg font-bold mb-6">{t("Services")}</h2>
                        <ul className="space-y-3">
                            <li>{t("AI assistant for petcare")}</li>
                            <li>{t("Easier Access to emergency services")}</li>
                            <li>{t("Cheaper and convinient consulting")}</li>
                            <li>{t("Skin Anomaly Detection")}</li>
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div>
                        <h2 className="text-lg font-bold mb-6">{t("Contact Us")}</h2>
                        <ul className="space-y-3">
                            <li>pawmeowmanool@gmail.com</li>
                            <li>tanjinulislam16@gmail.com</li>
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h2 className="text-lg font-bold mb-6">{t("Social Media")}</h2>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className="flex items-center hover:text-green-500 transition">
                                    <i className="fab fa-facebook-f"></i>
                                    <span className="ml-3">Facebook</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center hover:text-green-500 transition">
                                    <i className="fab fa-instagram"></i>
                                    <span className="ml-3">Instagram</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center hover:text-green-500 transition">
                                    <i className="fab fa-twitter"></i>
                                    <span className="ml-3">Twitter</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" className="flex items-center hover:text-green-500 transition">
                                    <i className="fab fa-youtube"></i>
                                    <span className="ml-3">YouTube</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <footer className="mx-auto max-w-6xl w-full px-4 mt-8 mb-20">
                {/* Top row: cat gif + about */}
                <div className="flex items-center justify-between gap-4 bg-black/80 backdrop-blur-md  shadow p-4">
                    {/* Cat gif center on small screens */}
                    <div className="flex justify-center w-full">
                        <img
                            src="/giphy/cat playing a recorder.gif"
                            alt="Cat playing a recorder"
                            className="h-16 w-auto"
                        />
                    </div>
                    {/* Info button */}
                    
                </div>

                {/* Bottom text */}
                <div className="mt-6 flex flex-col items-center">
                   
                    
                    {/* Copyright and review */}
                    <p className="text-sm text-slate-600 text-center">
                        © {new Date().getFullYear()} PawPal. All rights reserved.<br />
                        Leave a review at{" "}
                        <a
                            href="mailto:pawmeowmanool@gmail.com"
                            className="text-gray-300  decoration-[#fdd142] decoration-2 underline-offset-2"
                        >
                            pawmeowmanool@gmail.com
                        </a>
                    </p>
                </div>
            </footer>
        </footer>


    );
};

export default Footer;