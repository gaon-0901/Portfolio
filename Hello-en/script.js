Loadr = new (function Loadr(id) {
  // 상수 설정
  const max_size = 24;                    // 파티클의 최대 크기
  const max_particles = 1500;            // 파티클의 최대 개수
  const min_vel = 250;                    // 파티클의 최소 속도
  const max_generation_per_frame = 10;    // 프레임당 생성되는 파티클의 최대 개수

  // 캔버스와 컨텍스트 설정
  var canvas = document.getElementById(id);    // ID로 캔버스 엘리먼트 가져오기
  var ctx = canvas.getContext('2d');           // 2D 컨텍스트 가져오기
  var height = canvas.height;                  // 캔버스의 높이
  var center_y = height / 2;                  // 캔버스의 수직 중심
  var width = canvas.width;                    // 캔버스의 너비
  var center_x = width / 2;                   // 캔버스의 수평 중심

  // 파티클 속성
  var particles = [];              // 파티클들을 담을 배열
  var last = Date.now(), now = 0;  // 파티클 이동에 사용될 시간 변수
  var dt;                          // 프레임 사이의 델타 시간

  // 특정 지점이 하트 모양 내부에 있는지 확인하는 함수
  function isInsideHeart(x, y) {
      x = ((x - center_x) / (center_x)) * 3;
      y = ((y - center_y) / (center_y)) * -3;
      var x2 = x * x;
      var y2 = y * y;    
      return (Math.pow((x2 + y2 - 1), 3) - (x2 * (y2 * y)) < 0);
  }

  // 주어진 범위 내에서 랜덤한 값을 생성하는 함수
  function random(size, freq) {
      var val = 0;
      var iter = freq;      
      do {
          size /= iter;
          iter += freq;
          val += size * Math.random();
      } while (size >= 1);
      return val;
  }

  // 파티클 클래스
  function Particle() {
      var x = center_x;                                  // 초기 X 위치
      var y = center_y;                                  // 초기 Y 위치
      var size = ~~random(max_size, 2.4);               // 랜덤한 파티클 크기
      var x_vel = ((max_size + min_vel) - size) / 2 - (Math.random() * ((max_size + min_vel) - size));  // X 방향 속도
      var y_vel = ((max_size + min_vel) - size) / 2 - (Math.random() * ((max_size + min_vel) - size));  // Y 방향 속도
      var nx = x;                                       // 새로운 X 위치
      var ny = y;                                       // 새로운 Y 위치
      var r, g, b, a = 0.05 * size;                     // 색상과 투명도

      // 파티클 그리기 함수
      this.draw = function() {
          r = ~~(255 * (x / width));
          g = ~~(255 * (1 - (y / height)));
          b = ~~(255 - r);
          ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2, true); 
          ctx.closePath();
          ctx.fill();
      }

      // 파티클 이동 함수
      this.move = function(dt) {
          nx += x_vel * dt;
          ny += y_vel * dt;

          if (!isInsideHeart(nx, ny)) {
              if (!isInsideHeart(nx, y)) {
                  x_vel *= -1;
                  return;
              }       
              if (!isInsideHeart(x, ny)) {
                  y_vel *= -1;
                  return;
              }
              x_vel = -1 * y_vel;
              y_vel = -1 * x_vel;
              return;
          }
          x = nx;
          y = ny;
      }
  }

  // 파티클 생성 및 이동 함수
  function movementTick() {
      var len = particles.length;
      var dead = max_particles - len;
      for (var i = 0; i < dead && i < max_generation_per_frame; i++) {
          particles.push(new Particle());
      } 

      now = Date.now();
      dt = last - now;
      dt /= 1000;
      last = now;

      particles.forEach(function(p) {
          p.move(dt);
      });
  }

  // 파티클 그리기 함수
  function tick() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(function(p) {
          p.draw();
      });
      requestAnimationFrame(tick);
  }

  // 시작 및 완료 함수 (현재는 빈 함수이지만 추가적인 기능을 위해 사용할 수 있음)
  this.start = function() {}
  this.done = function() {}

  // 파티클 생성 간격 설정 및 파티클 그리기 시작
  setInterval(movementTick, 16);
  tick();
})("loader");
