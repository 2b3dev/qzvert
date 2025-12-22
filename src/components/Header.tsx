import IconApp from '@/components/icon/icon-app'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Compass, Home, Menu, Plus, X } from 'lucide-react'
import { useState } from 'react'
export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/explore', label: 'Explore', icon: Compass },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <IconApp className="w-6 h-6" />
              </motion.div>
              <span className="font-black text-xl text-white group-hover:text-purple-300 transition-colors">
                qzvert
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
                  activeProps={{
                    className:
                      'flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <Link
                to="/"
                hash="create"
                className="flex items-center gap-2 ml-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 right-0 w-72 bg-slate-900 border-l border-slate-800 z-50 md:hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <span className="font-bold text-lg text-white">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-purple-500/20 text-purple-300',
              }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <Link
            to="/"
            hash="create"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors mt-4"
          >
            <Plus className="w-5 h-5" />
            Create Quest
          </Link>
        </nav>
      </motion.div>

      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}
    </>
  )
}
