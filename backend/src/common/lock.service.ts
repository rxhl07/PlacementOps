import { redis } from '../config/redis';
import { AppError } from './errors';

export class DistributedLock {
    /**
     * Acquires an atomic lock using Redis SET key value NX PX.
     * Prevents concurrent execution of schedule generation or replanning.
     */
    static async acquire(lockKey: string, ttlMs: number = 10000): Promise<string | null> {
        const lockValue = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const result = await redis.set(`lock:${lockKey}`, lockValue, 'PX', ttlMs, 'NX');
        return result === 'OK' ? lockValue : null;
    }

    /**
     * Releases lock safely using a Lua script to ensure an process only deletes its own lock.
     */
    static async release(lockKey: string, lockValue: string): Promise<boolean> {
        const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

        const result = await redis.eval(luaScript, 1, `lock:${lockKey}`, lockValue);
        return result === 1;
    }

    /**
     * Helper to execute a callback within an atomic lock scope.
     */
    static async withLock<T>(
        lockKey: string,
        ttlMs: number,
        callback: () => Promise<T>
    ): Promise<T> {
        const lockValue = await this.acquire(lockKey, ttlMs);
        if (!lockValue) {
            throw new AppError(
                'Concurrent Operation Conflict: Another schedule mutation is currently in progress. Please try again shortly.',
                409
            );
        }

        try {
            return await callback();
        } finally {
            await this.release(lockKey, lockValue);
        }
    }
}