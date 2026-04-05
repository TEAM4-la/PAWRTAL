using Microsoft.AspNetCore.Mvc;
using PawrtalWeb.Models;

namespace PawrtalWeb.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserAccountsController : ControllerBase
    {
        [HttpGet("Users/{id}")]
        public UserVM GetUserByID(int id)
        {
            var user = new UserVM();
            return user;
        }
    }
}
