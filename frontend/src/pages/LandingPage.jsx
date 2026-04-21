import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Check, Home, Search, UserPlus, Building2,
    MapPin, Shield, Menu, X, Star, Users, ArrowRight, Sparkles
} from 'lucide-react';

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
            }`}>
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:py-4">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md">
                            <Home className="h-4.5 w-4.5 text-white" />
                        </div>
                        <span className={`text-base font-bold tracking-tight transition-colors ${
                            scrolled ? 'text-slate-900' : 'text-white'
                        }`}>
                            Boarders Monitor
                        </span>
                    </div>

                    {/* Desktop nav links */}
                    <nav className="hidden items-center gap-6 md:flex">
                        <button
                            onClick={() => scrollTo('features')}
                            className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                                scrolled ? 'text-slate-600' : 'text-white/80'
                            }`}
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollTo('owners')}
                            className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                                scrolled ? 'text-slate-600' : 'text-white/80'
                            }`}
                        >
                            For Owners
                        </button>
                        <Link to="/find-boarding">
                            <button className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                                scrolled ? 'text-slate-600' : 'text-white/80'
                            }`}>
                                Find Boarding
                            </button>
                        </Link>
                    </nav>

                    {/* Desktop CTA buttons */}
                    <div className="hidden items-center gap-2 md:flex">
                        <Link to="/login">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`font-medium transition-colors ${
                                    scrolled
                                        ? 'text-slate-700 hover:bg-slate-100'
                                        : 'text-white hover:bg-white/15'
                                }`}
                            >
                                Sign In
                            </Button>
                        </Link>
                        <Link to="/register-owner">
                            <Button
                                size="sm"
                                className="bg-blue-600 font-medium text-white shadow-sm hover:bg-blue-700"
                            >
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className={`md:hidden p-1.5 rounded-lg transition-colors ${
                            scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/15'
                        }`}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile dropdown menu */}
                {menuOpen && (
                    <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden">
                        <nav className="mb-4 flex flex-col gap-1">
                            <button
                                onClick={() => scrollTo('features')}
                                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollTo('owners')}
                                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                For Owners
                            </button>
                            <Link to="/find-boarding" onClick={() => setMenuOpen(false)}>
                                <button className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
                                    Find Boarding
                                </button>
                            </Link>
                        </nav>
                        <div className="flex flex-col gap-2">
                            <Link to="/login" onClick={() => setMenuOpen(false)}>
                                <Button variant="outline" className="w-full font-medium">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/register-owner" onClick={() => setMenuOpen(false)}>
                                <Button className="w-full bg-blue-600 font-medium hover:bg-blue-700">
                                    Get Started — It's Free
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* ── Hero Section ───────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pb-24 pt-28 sm:px-6 sm:pb-32 sm:pt-36 lg:pb-40 lg:pt-44">

                {/* Background decoration */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl sm:h-175 sm:w-175" />
                    <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl sm:h-96 sm:w-96" />
                </div>

                <div className="relative mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5">
                        <Star className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-blue-300 sm:text-sm">
                            Trusted by students across the city
                        </span>
                    </div>

                    <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                        Find Your Perfect{' '}
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Boarding House
                        </span>
                    </h1>

                    <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-blue-200/80 sm:text-lg md:text-xl">
                        Discover affordable and comfortable boarding houses near your school.
                        Browse verified listings, compare prices, and find your new home today.
                    </p>

                    {/* CTA Buttons with enhanced styling */}
                    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                        <Link to="/find-boarding" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="w-full gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-7 py-6 text-base font-semibold shadow-xl shadow-blue-500/30 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 sm:w-auto"
                            >
                                <Search className="h-5 w-5" />
                                Find Boarding Houses
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/register-owner" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full gap-2 border-white/25 bg-white/5 px-7 py-6 text-base font-semibold text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/10 hover:shadow-lg transition-all duration-300 hover:scale-105 sm:w-auto"
                            >
                                <UserPlus className="h-5 w-5" />
                                List Your Property
                            </Button>
                        </Link>
                    </div>

                    {/* Stats row */}
                    {/* <div className="mt-14 grid grid-cols-3 gap-4 border-t border-white/10 pt-10 sm:mt-16 sm:gap-8">
                        {[
                            { value: '500+', label: 'Listings' },
                            { value: '2k+', label: 'Students Helped' },
                            { value: '100%', label: 'Free to Use' },
                        ].map(({ value, label }) => (
                            <div key={label} className="text-center">
                                <p className="text-2xl font-bold text-white sm:text-3xl">{value}</p>
                                <p className="mt-0.5 text-xs text-blue-300 sm:text-sm">{label}</p>
                            </div>
                        ))}
                    </div> */}
                </div>
            </section>

            {/* ── Features Section ───────────────────────────────────────── */}
            <section id="features" className="bg-gradient-to-b from-slate-50 to-white px-4 py-20 sm:px-6 lg:py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto mb-14 max-w-2xl text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">Features</span>
                        </div>
                        <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                            Why Choose Boarders Monitor?
                        </h2>
                        <p className="text-slate-500 sm:text-base md:text-lg">
                            We connect students with quality boarding houses and help property owners reach more tenants.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: Search,
                                iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
                                iconColor: 'text-white',
                                title: 'Easy Search',
                                desc: 'Filter by price, location, and amenities to find the perfect boarding house for your needs.',
                            },
                            {
                                icon: MapPin,
                                iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
                                iconColor: 'text-white',
                                title: 'Nearby Locations',
                                desc: 'Find boarding houses close to your school with our location-based search feature.',
                            },
                            {
                                icon: Shield,
                                iconBg: 'bg-gradient-to-br from-violet-500 to-violet-600',
                                iconColor: 'text-white',
                                title: 'Verified Listings',
                                desc: 'All boarding houses are verified to ensure safe and quality accommodations for students.',
                            },
                        ].map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
                            <Card
                                key={title}
                                className="group border-0 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <CardContent className="p-6 sm:p-8">
                                    <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg} shadow-lg`}>
                                        <Icon className={`h-7 w-7 ${iconColor}`} />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
                                    <p className="text-sm leading-relaxed text-slate-500 sm:text-base">{desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── For Owners Section ─────────────────────────────────────── */}
            <section id="owners" className="bg-white px-4 py-20 sm:px-6 lg:py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="grid items-center gap-12 md:grid-cols-2 lg:gap-20">
                        <div>
                            <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                                For Property Owners
                            </span>
                            <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                                Are You a Boarding House Owner?
                            </h2>
                            <p className="mb-8 leading-relaxed text-slate-500 sm:text-lg">
                                Register your property and reach hundreds of students looking for affordable housing.
                                Managing your listings has never been easier.
                            </p>

                            <ul className="mb-10 space-y-4">
                                {[
                                    'Free registration — no hidden fees',
                                    'Easy property management dashboard',
                                    'Reach more students instantly',
                                    'Manage inquiries in one place',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                            <Check className="h-3 w-3 text-emerald-600" />
                                        </div>
                                        <span className="text-sm text-slate-700 sm:text-base">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link to="/register-owner">
                                    <Button
                                        size="lg"
                                        className="w-full gap-2 bg-blue-600 font-semibold hover:bg-blue-700 sm:w-auto"
                                    >
                                        <Building2 className="h-5 w-5" />
                                        Register Your Property
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full font-semibold sm:w-auto"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Illustration */}
                        <div className="flex justify-center md:justify-end">
                            <div className="relative">
                                <div className="flex h-56 w-56 items-center justify-center rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-200 sm:h-72 sm:w-72 lg:h-80 lg:w-80">
                                    <Building2 className="h-28 w-28 text-white/80 sm:h-36 sm:w-36 lg:h-40 lg:w-40" />
                                </div>
                                {/* Floating badge */}
                                {/* <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-lg">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs font-semibold text-slate-800">2,000+ Students</span>
                                </div>
                                <div className="absolute -right-4 -top-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-lg">
                                    <Star className="h-4 w-4 text-amber-500" />
                                    <span className="text-xs font-semibold text-slate-800">Top Rated</span>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ─────────────────────────────────────────────── */}
            <section className="bg-linear-to-r from-blue-600 to-indigo-700 px-4 py-16 sm:px-6 sm:py-20">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                        Ready to Find Your New Home?
                    </h2>
                    <p className="mb-8 text-blue-100 sm:text-lg">
                        Join thousands of students who found their perfect boarding house with us.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link to="/find-boarding" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="w-full gap-2 bg-white px-8 font-semibold text-blue-700 hover:bg-blue-50 sm:w-auto"
                            >
                                <Search className="h-4 w-4" />
                                Start Searching
                            </Button>
                        </Link>
                        <Link to="/register-owner" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full gap-2 border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 sm:w-auto"
                            >
                                <UserPlus className="h-4 w-4" />
                                Register as Owner
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="bg-slate-900 px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                                <Home className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-white">Boarders Monitor</span>
                        </div>
                        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
                            <button onClick={() => scrollTo('features')} className="transition-colors hover:text-white">
                                Features
                            </button>
                            <button onClick={() => scrollTo('owners')} className="transition-colors hover:text-white">
                                For Owners
                            </button>
                            <Link to="/find-boarding" className="transition-colors hover:text-white">
                                Find Boarding
                            </Link>
                            <Link to="/login" className="transition-colors hover:text-white">
                                Sign In
                            </Link>
                        </nav>
                    </div>
                    <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
                        &copy; 2026 Boarders Monitor. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
