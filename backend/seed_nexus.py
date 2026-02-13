"""
NEXUS Game - Database Seeding Script

Run this script to initialize the game database with Avenger flags.
"""

from models import init_db, seed_game_flags, cleanup_expired_sessions
from config import Config

def main():
    print("=" * 60)
    print("NEXUS GAME - DATABASE INITIALIZATION")
    print("=" * 60)
    
    print("\n📦 Initializing database indexes...")
    init_db()
    
    print("\n🎮 Seeding Avenger flags...")
    seed_game_flags()
    
    print("\n🧹 Cleaning up expired sessions...")
    cleanup_expired_sessions()
    
    print("\n" + "=" * 60)
    print("✅ NEXUS DATABASE READY!")
    print("=" * 60)
    
    print("\n📋 Game Configuration:")
    print(f"   - Avengers: {len(Config.AVENGERS)}")
    print(f"   - Session Expiry: {Config.SESSION_EXPIRY_HOURS} hours")
    print(f"   - Max Attempts: {Config.MAX_ATTEMPTS_PER_AVENGER}")
    print(f"   - Cooldown: {Config.COOLDOWN_DURATION_MINUTES} minutes")
    
    print("\n🎯 Default Flags (FOR TESTING ONLY - CHANGE IN PRODUCTION):")
    print("   - Iron Man: neXus{t0ny_st4rk_1s_ir0nm4n}")
    print("   - Captain America: neXus{r0g3rs}")
    print("   - Thor: neXus{wr7hy_0f_mj0ln1r}")
    print("   - Deadpool: flag{w4d3_l0v3s_ch1m1ch4ng4s_4nd_sqli}")
    print("   - Hulk: neXus{H0LK_G1MM1_ENTRY}")
    print("   - Hawkeye: neXus{a1m_f0r_th3_h34rt}")
    
    print("\n🚀 Ready to start backend with: python app.py")
    print()

if __name__ == "__main__":
    main()
