import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarIcon, Plus, Users, Calendar, TrendingUp, AlertTriangle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CarManagement from "@/components/admin/CarManagement";
import BookingManagement from "@/components/admin/BookingManagement";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import UserManagement from "@/components/admin/UserManagement";
import { carsAPI, bookingsAPI, usersAPI } from "@/services/api";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalCars: 0,
    activeBookings: 0,
    totalUsers: 0,
    lowStockCars: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    
    setUser(parsedUser);
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [cars, bookings, users] = await Promise.all([
        carsAPI.getAll(),
        bookingsAPI.getAll(),
        usersAPI.getAll()
      ]);

      const activeBookings = bookings.filter(b => b.status === "confirmed").length;
      const lowStockCars = cars.filter(c => c.quantity <= 2).length;
      const revenue = bookings
        .filter(b => b.status === "confirmed")
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      setStats({
        totalCars: cars.length,
        activeBookings,
        totalUsers: users.length,
        lowStockCars,
        revenue
      });
    } catch (error) {
      toast({
        title: "Error loading statistics",
        description: error.message || "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the admin panel.",
    });
    navigate("/");
  };

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <CarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <CarIcon className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">RentCar Admin</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cars</CardTitle>
              <CarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCars}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.lowStockCars}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">₹{stats.revenue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="cars" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cars">Car Management</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="cars" className="mt-6">
            <CarManagement onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <BookingManagement onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
