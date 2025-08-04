#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Serve ultimate dashboard
        if path in ['/', '/ultimate']:
            self.serve_file('ultimate-dashboard.html')
        elif path == '/dashboard':
            self.serve_file('dashboard.html')
        elif path == '/health':
            self.send_json({
                'status': 'healthy',
                'timestamp': '2025-06-27T05:00:00Z',
                'message': 'Ultimate Dashboard Server Running!'
            })
        elif path == '/api/students':
            self.send_json({
                'success': True,
                'data': [
                    {
                        'id': 1,
                        'name': 'João Santos',
                        'category': 'Adult',
                        'progress': 85,
                        'attendance': 92,
                        'risk': 'low',
                        'status': 'active'
                    },
                    {
                        'id': 2,
                        'name': 'Maria Silva',
                        'category': 'Master 1',
                        'progress': 76,
                        'attendance': 88,
                        'risk': 'low',
                        'status': 'active'
                    }
                ]
            })
        elif path == '/api/organizations':
            self.send_json({
                'success': True,
                'data': [
                    {
                        'id': 1,
                        'name': 'Elite Krav Maga Academy',
                        'studentsCount': 156,
                        'isActive': True
                    }
                ]
            })
        elif path == '/api/techniques':
            self.send_json({
                'success': True,
                'data': [
                    {
                        'id': 1,
                        'name': 'Guarda de Boxe',
                        'category': 'DEFENSE',
                        'difficulty': 1,
                        'masteryRate': 95
                    }
                ]
            })
        else:
            super().do_GET()
    
    def serve_file(self, filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404, f"File {filename} not found")
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == "__main__":
    PORT = 3000
    
    print("\n🚀 =================================")
    print("🥋 ULTIMATE DASHBOARD SERVER RUNNING!")
    print("🚀 =================================")
    print(f"🌐 URL: http://localhost:{PORT}")
    print(f"🚀 ULTIMATE DASHBOARD: http://localhost:{PORT}/ultimate")
    print(f"📊 BASIC DASHBOARD: http://localhost:{PORT}/dashboard")
    print(f"❤️  HEALTH: http://localhost:{PORT}/health")
    print("🔥 =================================\n")
    
    with socketserver.TCPServer(("", PORT), DashboardHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down gracefully...")
            httpd.shutdown()