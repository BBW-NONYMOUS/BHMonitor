import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search, UserPlus, Building2, MapPin, Shield } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Navigation */}
            <nav className="absolute top-0 left-0 right-0 z-10 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Home className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold">Boarders Monitor</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button variant="ghost" className="text-white hover:bg-white/10">
                                Sign In
                            </Button>
                        </Link>
                        <Link to="/register-owner">
                            <Button className="bg-blue-500 hover:bg-blue-600">
                                Register as Owner
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                        Find Your Perfect
                        <span className="text-blue-400"> Boarding House</span>
                    </h1>
                    <p className="text-lg md:text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
                        Discover affordable and comfortable boarding houses near your school. 
                        Browse listings, compare prices, and find your new home today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/find-boarding">
                            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-lg px-8 py-6">
                                <Search className="mr-2 h-5 w-5" />
                                Find Boarding Houses
                            </Button>
                        </Link>
                        <Link to="/register-owner">
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10">
                                <UserPlus className="mr-2 h-5 w-5" />
                                List Your Property
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
                        Why Choose Boarders Monitor?
                    </h2>
                    <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
                        We connect students with quality boarding houses and help property owners reach more tenants.
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6 text-center">
                                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-7 w-7 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">Easy Search</h3>
                                <p className="text-slate-600">
                                    Filter by price, location, and amenities to find the perfect boarding house for your needs.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6 text-center">
                                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="h-7 w-7 text-green-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">Nearby Locations</h3>
                                <p className="text-slate-600">
                                    Find boarding houses close to your school with our location-based search feature.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-6 text-center">
                                <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                                    <Shield className="h-7 w-7 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">Verified Listings</h3>
                                <p className="text-slate-600">
                                    All boarding houses are verified to ensure safe and quality accommodations.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* For Owners Section */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">
                                Are You a Boarding House Owner?
                            </h2>
                            <p className="text-slate-600 mb-6">
                                Register your property and reach hundreds of students looking for affordable housing. 
                                Managing your listings has never been easier.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-slate-700">
                                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <span className="text-green-600 text-sm">✓</span>
                                    </div>
                                    Free registration
                                </li>
                                <li className="flex items-center gap-3 text-slate-700">
                                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <span className="text-green-600 text-sm">✓</span>
                                    </div>
                                    Easy property management
                                </li>
                                <li className="flex items-center gap-3 text-slate-700">
                                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <span className="text-green-600 text-sm">✓</span>
                                    </div>
                                    Reach more students
                                </li>
                            </ul>
                            <Link to="/register-owner">
                                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                                    <Building2 className="mr-2 h-5 w-5" />
                                    Register Your Property
                                </Button>
                            </Link>
                        </div>
                        <div className="hidden md:flex justify-center">
                            <div className="h-64 w-64 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <Building2 className="h-32 w-32 text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 bg-slate-900 text-center text-slate-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Home className="h-5 w-5" />
                    <span className="font-semibold text-white">Boarders Monitor</span>
                </div>
                <p className="text-sm">© 2026 Boarders Monitor. All rights reserved.</p>
            </footer>
        </div>
    );
}
