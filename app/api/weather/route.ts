import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHOPAL_LAT = "30.95";
const CHOPAL_LON = "77.58";
const CACHE_TTL_MINUTES = 10;

export async function GET(request: NextRequest) {
  try {
    // Check database cache first
    const cachedWeather = await prisma.weatherCache.findFirst({
      orderBy: { fetchedAt: "desc" },
    });

    const now = new Date();
    if (cachedWeather) {
      const diffMinutes = (now.getTime() - new Date(cachedWeather.fetchedAt).getTime()) / (1000 * 60);
      if (diffMinutes < CACHE_TTL_MINUTES) {
        return NextResponse.json({
          temperature: cachedWeather.temperature,
          feelsLike: cachedWeather.feelsLike,
          humidity: cachedWeather.humidity,
          windSpeed: cachedWeather.windSpeed,
          condition: cachedWeather.condition,
          icon: cachedWeather.icon,
          elevation: cachedWeather.elevation,
          source: "cache",
        });
      }
    }

    // Fetch live weather from OpenWeatherMap API
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        temperature: 14,
        feelsLike: 12,
        humidity: 68,
        windSpeed: 8.5,
        condition: "Partly Cloudy",
        icon: "02d",
        elevation: 2300,
        source: "fallback",
      });
    }

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${CHOPAL_LAT}&lon=${CHOPAL_LON}&units=metric&appid=${apiKey}`
    );

    if (!res.ok) {
      throw new Error(`OpenWeatherMap API error: ${res.statusText}`);
    }

    const data = await res.json();

    const weatherData = {
      location: "Chopal, Himachal Pradesh",
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0]?.main || "Clear",
      icon: data.weather[0]?.icon || "01d",
      elevation: 2300,
      fetchedAt: now,
    };

    // Store in database cache
    await prisma.weatherCache.create({
      data: weatherData,
    });

    return NextResponse.json({ ...weatherData, source: "live" });
  } catch (error) {
    console.error("Weather API Error:", error);
    return NextResponse.json(
      {
        temperature: 14,
        feelsLike: 12,
        humidity: 68,
        windSpeed: 8.5,
        condition: "Partly Cloudy",
        icon: "02d",
        elevation: 2300,
        source: "fallback",
      },
      { status: 200 }
    );
  }
}