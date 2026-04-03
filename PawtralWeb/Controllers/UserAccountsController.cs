using Microsoft.AspNetCore.Mvc;
using PawtralWeb.Models;

namespace PawtralWeb.Controllers
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
